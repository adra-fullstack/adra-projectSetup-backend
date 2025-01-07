const app = require('./app');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');
const http = require('http');
const httpServer = http.createServer(app);
const { Server } = require('socket.io')
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000"]
    }
});

dotenv.config({ path: path.join(__dirname, "src/config", "config.env") })
const connectDatabase = require('./src/config/database');
const socket = require('./src/config/socket');


// io.use(async (socket, next) => {
//     try {
//         const user = await fetchUser(socket);
//         socket.user = user; // Attach the user object to the socket
//         next(); // Call next() to proceed to the next middleware or event handler
//     } catch (e) {
//         next(new Error("unknown user")); // Pass an error to the next middleware if fetching fails
//     }
// });
// async function fetchUser(socket) {
//     const token = socket.handshake.query.token; // Example: extracting token from query params
//     console.log(token,"token")
//     // if (!token) throw new Error('No token provided');

//     // // Fetch user information from a database or another service
//     // const user = await database.getUserByToken(token);
//     // if (!user) throw new Error('Invalid token');

//     // return user;
// }

io.on("connection", socket);


connectDatabase().catch(console.dir);

// attendance scheduling 
var task = cron.schedule('00 00 * * *', () => {
    console.log("runs every night 12'0 clock");

    task.stop();
});


const server = httpServer.listen(process.env.PORT, () => {
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