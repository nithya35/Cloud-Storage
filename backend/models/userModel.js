const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'Please tell us your name!']
    },
    email: {
        type: String,
        unique: true,
        required: [true,'Please provide your email!'],
        lowercase: true
    },
    password: {
        type: String,
        minlength: 8,
        required: [true,'Please provide password!'],
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
    type: String,
       enum: ['user', 'admin'],
       default: 'user'
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    }
});

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password,12);
    next();
});

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew){
        return next();
    }
    this.passwordChangedAt = Date.now()-1000;
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
       const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
       //passwordChangedAt will be in date format and JWTTimeStamp in seconds
       return JWTTimestamp < changedTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    //similar to password this also should be encrypted and shouldn't be stored plain in database
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10*60*1000;

    return resetToken;
    //we must send unencrypted reset token to user via mail
}

const User = mongoose.model('User',userSchema);

module.exports = User;