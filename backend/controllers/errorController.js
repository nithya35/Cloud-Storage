const AppError = require('./../utils/appError');

const handleCastErrorDB = err =>{
   const message = `Invalid ${err.path}: ${err.value}.`;
   return new AppError(message,400); 
}

const handleDuplicateFieldsDB = err =>{
   //in errmsg our value will be between quotes
   //so to extract that we use regular expression matching between quotes
   const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
   //match will be an array.in that first element will be value
   const message = `Duplicate field value: ${value}.Please use another value`;
   return new AppError(message,400);
}

const handleValidationErrorDB = err =>{
   const errors = Object.values(err.errors).map(el=>el.message);
   const message = `Invalid input data.${errors.join('. ')}`;
   return new AppError(message,400);
}

const handleJWTError = err =>{
   return new AppError('Invalid token.Please log in again!',401);
}

const handleJWTExpiredError = err =>{
   return new AppError('Your token has expired! Please log in again',401);
}
//basically we are making error operational in these handlers and then passing to sendErrorProd


//in development , we want to send maximum details
// const sendErrorDev = (err,req,res) =>{
//    //api
//    if(req.originalUrl.startsWith('/api')){
//       res.status(err.statusCode).json({
//          status: err.status,
//          error: err,
//          message: err.message,
//          stack: err.stack
//       });
//    }
//    //rendered website
//    else{
//       console.log('ERROR ',err);
//       res.status(err.statusCode).render('error',{
//          title: 'Something went wrong!',
//          msg: err.message
//       });
//    }
// }

const sendErrorDev = (err,req,res) =>{
   //api
   if(req.originalUrl.startsWith('/api')){
      //we want to send a proper error message only in case of operational errors
      if(err.isOperational){
         return res.status(err.statusCode).json({
           status: err.status,
           message: err.message
         });
      }

      //these are programming or other unknown errors in case of not operational
      //so we dont want to leak details to user
      //log error
      console.error('ERROR',err);
      //send generic message
      return res.status(500).json({
         status: 'error',
         message: 'Something went wrong'
      });
   }

   //rendered website
   if(err.isOperational){
      return res.status(err.statusCode).render('error',{
         title: 'Something went wrong!',
         msg: err.message
      });
   }

   console.error('ERROR ',err);
   return res.status(err.statusCode).render('error',{
      title: 'Something went wrong!',
      msg: 'Please try again later.'
   });
}

const sendErrorProd = (err,req,res) =>{
   //api
   if(req.originalUrl.startsWith('/api')){
      //we want to send a proper error message only in case of operational errors
      if(err.isOperational){
         return res.status(err.statusCode).json({
           status: err.status,
           message: err.message
         });
      }

      //these are programming or other unknown errors in case of not operational
      //so we dont want to leak details to user
      //log error
      console.error('ERROR',err);
      //send generic message
      return res.status(500).json({
         status: 'error',
         message: 'something went very wrong'
      });
   }

   //rendered website
   if(err.isOperational){
      return res.status(err.statusCode).render('error',{
         title: 'Something went wrong!',
         msg: err.message
      });
   }

   console.error('ERROR ',err);
   return res.status(err.statusCode).render('error',{
      title: 'Something went wrong!',
      msg: 'Please try again later.'
   });
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    error.message = err.message;
    error.name = err.name;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res);
  }
};

