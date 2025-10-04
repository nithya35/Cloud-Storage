const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cron = require('node-cron');
const trashController = require('./controllers/trashController');

process.on('uncaughtException',err=>{
    console.log('UNCAUGHT EXCEPTION! Shutting down..');
    console.log(err.name,err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(db).then(con=>{
  //console.log(con.connections);
  console.log("Database connected successfully");
});

const app = require('./app');

const port = process.env.PORT || 3000;

const server = app.listen(3000, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection',err=>{
  console.log(err.name,err.message);
  console.log("UNHANDLER REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

cron.schedule('0 0 * * *', async () => {
  try {
    console.log("Running scheduled task: auto delete trashed items...");
    await trashController.autoDeleteOldTrash();
    console.log("Auto-delete completed ");
  } catch (err) {
    console.error("Error in auto-delete cron job:", err);
  }
});