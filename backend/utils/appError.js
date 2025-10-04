class AppError extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        //we are creating this to send error messages back to client for only these operational errors created in this class
        Error.captureStackTrace(this,this.constructor);
    }
}

module.exports = AppError;