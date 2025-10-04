const path = require('path');
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

app.use(helmet());

const limiter = rateLimit({
  max: 500,
  windowMs: 60*60*1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api',limiter);

// app.use(cors({
//   origin: 'http://localhost:5173',
//   credentials: true 
// }));

app.use(cors());
app.options('*',cors());

app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.urlencoded({extended: true,limit: '10kb'}));

app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

app.use(hpp());

app.set('trust proxy', 1);

const usersRouter = require('./routes/userRoutes');
const fileRouter = require('./routes/fileRoutes');
const folderRouter = require('./routes/folderRoutes');
const trashRouter = require('./routes/trashRoutes');

app.use('/api/v1/users', usersRouter);
app.use('/api/v1/files', fileRouter);
app.use('/api/v1/folders',folderRouter);
app.use('/api/v1/trash',trashRouter);
app.all('*',(req,res,next)=>{
  next(new AppError(`Can't find ${req.originalUrl} on this server`,404));
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is Running Successfully");
  });
}

app.use(globalErrorHandler);

module.exports = app;