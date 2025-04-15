const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorMiddleWare = require('./src/middlewares/error');
const cookieParser = require('cookie-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(cors())


const userRouter = require('./src/routes/auth');
const questions = require('./src/routes/questions');
const campaign = require("./src/routes/campaign")


//Route paths 
app.use('/api/v1', userRouter);
app.use('/api/v1', questions);
app.use('/api/v1', campaign);


//handling errors should be used in last
app.use(errorMiddleWare)

module.exports = app;