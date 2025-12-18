const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorMiddleWare = require('./src/middlewares/error');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors())


const userRouter = require('./src/routes/auth');
const questions = require('./src/routes/questions');
const campaign = require("./src/routes/campaign");
const fellowhip = require("./src/routes/fellowshipform");
const { decryptData } = require('./src/security/crypto/crypto');
const ErrorHandler = require('./src/utils/errorHandling');

app.all('/:encryptedPath(*)', (req, res, next) => {
    console.log('---------------------------------------------')

    if (process.env.NODE_ENV === "production") {
        try {

            // Split URL into base and query string
            const [baseUrl = '', queryParams = ''] = req.originalUrl.split('?');
            const disable_restriction_for = ["/api/v1/maintanance_mode", "/api/v1/is_maintanance_break_announced"].includes(baseUrl);

            if (!disable_restriction_for) {
                // Decrypt base URL (removing leading '/')
                const decryptedBase = decryptData(baseUrl.slice(1));
                if (!decryptedBase) throw new Error('Access denied');

                // Check endpoint timeout
                const now = new Date();
                if (new Date(decryptedBase.validating_time) < now) return next(new ErrorHandler("Endpoint timeout reached", 201));

                // Set decrypted endpoint as request URL
                req.url = decryptedBase.endpoint || '';

                // Decrypt query string if present
                let queryObj = {};
                if (queryParams) {
                    const decryptedQuery = decryptData(queryParams);
                    if (decryptedQuery && decryptedQuery.query_string) queryObj = Object.fromEntries(new URLSearchParams(decryptedQuery.query_string));
                }
                req.query = queryObj;

                // Decrypt JSON body if present
                const isJson = req.headers['content-type']?.includes('application/json');
                if (isJson && req.body?.payload) {
                    const decryptedBody = decryptData(req.body.payload);
                    if (decryptedBody) req.body = decryptedBody;
                }
                console.log(`Request received time : ${new Date().toLocaleString()}, method: ${req.method}, url: ${req.originalUrl}`);
            }
            return next();
        } catch (err) {
            console.error('Decryption failed:', err.message);
            return next(new ErrorHandler("Invalid encrypted path or body", 201));
        }
    }
    else {
        console.log(`Request received time : ${new Date().toLocaleString()}, method: ${req.method}, url: ${req.originalUrl}`);
        return next();
    }
});

//Route paths 
app.use('/api/v1', userRouter);
app.use('/api/v1', questions);
app.use('/api/v1', campaign);
app.use('/api/v1', fellowhip);

app.use(errorMiddleWare)


module.exports = app;