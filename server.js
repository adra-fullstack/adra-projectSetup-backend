const app = require('./app');
const cors = require("cors");
require("dotenv").config();
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

const connectDatabase = require('./src/config/database');

connectDatabase().catch(console.dir);
// app.set('trust proxy', 1);
// // attendance scheduling 
// var task = cron.schedule('00 00 * * *', () => {
//     console.log("runs every night 12'0 clock");

//     task.stop();
// });

const server = app.listen(process.env.PORT, () => {
    console.log(`server listening to port ${process.env.PORT} in ${process.env.NODE_ENV}`)
})

process.on('unhandledRejection', (err) => {
    console.log(`Error : ${err.message}`);
    console.log('Shutting down the server due to unhandledRejection error');
    server.close(() => {
        process.exit(1);
    })
})

process.on('uncaughtException', (err) => {
    console.log(`Error : ${err.message}`);
    console.log('Shutting down the server due to uncaughtException error');
    server.close(() => {
        process.exit(1);
    })
})