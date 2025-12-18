const ErrorHandler = require("../utils/errorHandling");
const catchAsyncError = require("../middlewares/catchAsyncError");
const sendEmail = require("../utils/email");
const sendToken = require("../utils/jwt");
const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const jwt = require('jsonwebtoken');
const interviewCandidateModel = require("../models/interviewCandidateModel");
const QuestionGeneratorModel = require("../models/QuestionGeneratorModel");
const User = require("../models/userModel");
const { sha256 } = require("js-sha256");
const { CampaignModel } = require("../models/campaignModel");
const send_response = require("../functionPieces/send_reposnse");
const s3upload = require("../functionPieces/s3upload");
const maintananceModel = require("../models/maintanceModel");


exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { body, file } = req
    if (!file) return next(new ErrorHandler("Profile image Not found", 201));

    const { name, username, email, password, role } = body;
    const user = await User.findOne({ username })
    if (user) return next(new ErrorHandler("Username already exist", 201));
    else {
        const avatar = file.originalname;
        const newUser = await User.create({ name, username, email, password, avatar, role });
        sendToken(newUser, 201, res);
    }
});

exports.getUser = catchAsyncError(async (req, res, next) => {
    const users = await User.findById(req.user.id)
    send_response(res, 200, true, 0, users, 'user details fetched successfully');
})

exports.resetJwtToken = catchAsyncError(async (req, res, next) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return next(new ErrorHandler("No refresh token provided", 401));

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
    sendToken(user, 201, res);
})

exports.login = catchAsyncError(async (req, res, next) => {
    const authheader = req.headers.authorization;
    if (!authheader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
        return next(new ErrorHandler("Invalid or missing authorization header", 201));
    }

    // Basic Autherization  
    const base64Credentials = authheader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString();
    const [username, password] = credentials.split(':');
    if (!username || !password) {
        if (typeof username != Number) return next(new ErrorHandler("Invalid username or password", 201));
        else return next(new ErrorHandler("Please provide both username and password", 201));
    }

    //Finding users
    let candidateUser;
    let adraUser;
    let phoneNumber = username;
    if (isFinite(username)) candidateUser = await interviewCandidateModel.findOne({ phoneNumber }).select('+password');
    else adraUser = await User.findOne({ username }).select('+password');

    const user = candidateUser || adraUser;
    if (!user) throw next(new ErrorHandler("User not found", 201));

    // if interview candidates 
    if (candidateUser) {
        if (candidateUser?.oneTimeLoggedin) return next(new ErrorHandler(`The test has already been taken by ${candidateUser?.name}`, 201));
        const isValidPassword = await user.isCandidateValidPassword(password);
        if (!isValidPassword) return next(new ErrorHandler("Invalid username or password", 201));

        await QuestionGeneratorModel.findByIdAndUpdate(
            { _id: candidateUser?._id },
            {
                status: "Test Started"
            }
        );
        sendToken(user, 200, res);
    }

    if (adraUser) {
        const isValidPassword = await user.isValidPassword(password);
        if (!isValidPassword) return next(new ErrorHandler("Invalid username or password", 201));
        sendToken(user, 200, res);
    }
})

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new ErrorHandler("User not found with this email"), 404);

    const resetToken = user.getResetToken();
    user.save({ validateBeforeSave: false });

    //Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;
    const message = `Your password reser url is as follow \n\n
    ${resetUrl} \n\n If you have not requested this email, ignore it`

    try {
        sendEmail({
            email: user.email,
            subject: "Krishnacart reset password",
            message
        })

        res.status(200).json({
            success: true,
            message: `Email send to ${user.email}`
        })
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;

        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(err.message), 500);
    }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpire: {
            $gt: Date.now()
        }
    });

    if (!user) return next(new ErrorHandler('password reset token is invalid or expired'), 401)
    if (req.body.password !== req.body.confirmPassword) return next(new ErrorHandler('password does not match'), 201)

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });
    sendToken(user, 201, res);
})

exports.registerInterviewCandidate = catchAsyncError(async (req, res, next) => {
    const formdata = req.body;
    const { image } = req.files;
    const { phoneNumber, email } = formdata;
    let capitalizedEmail = email.charAt(0).toUpperCase() + email.slice(1);
    let create_password = capitalizedEmail.slice(0, 4) + '@' + phoneNumber.slice(0, 3);

    // if (!image) return next(new ErrorHandler("Kindly Upload the Image"));
    if (!formdata.have_children) formdata.have_children = "No";
    if (!formdata.remarks) formdata.remarks = "None";
    formdata.password = sha256(create_password);

    const user = await interviewCandidateModel.findOne({ $or: [{ phoneNumber: { $eq: phoneNumber } }, { email: { $eq: email } }] });
    if (user) return next(new ErrorHandler("phone number (or) email already exist", 201));

    if (image) {
        let s3_result = await s3upload('interview_candidates', image)
        formdata.profile_photo_path = s3_result[0]?.key || 'none';
    }

    const newUser = await interviewCandidateModel.create(formdata);

    let candidateExperience = "";
    if (newUser.canditateExpType === 0) candidateExperience = "fresher"
    else if (newUser.canditateExpType > 0 && newUser.canditateExpType <= 0) candidateExperience = "intermediate"
    else candidateExperience = "hard"

    await QuestionGeneratorModel.create({
        candidate_id: newUser._id,
        candidate_role: newUser.canditateRole,
        difficulty_level: candidateExperience
    })

    send_response(res, 200, true, 0, {
        username: phoneNumber,
        password: create_password
    }, 'Candidate registration success');
})

exports.get_registration_roles = catchAsyncError(async (req, res, next) => {
    const { check_campaign } = req.body;

    const start = new Date(check_campaign);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const available_roles = await CampaignModel.find(
        { interview_date: { $gte: start, $lt: end } },
        { job_title: 1, _id: 1 }
    );

    if (available_roles.length === 0) return next(new ErrorHandler("No roles available for this date", 201));
    send_response(res, 200, true, 0, available_roles, 'Available roles fetched successfully');
});


exports.maintananceMode = catchAsyncError(async (req, res, next) => {
    const { maintanance } = req.query;
    const auth_header = req.headers['authorization'];
    const custom_header = req.headers['x-custom-encrypted-header'];
    if (!auth_header) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
        return send_response(res, 200, false, 201, null, "Invalid or missing authorization header", req.url);
    }

    if (!custom_header)
        return send_response(res, 200, false, 201, null, "Invalid or missing custom header", req.url);

    const { endpoint_access_key, expire_on } = JSON.parse(Buffer.from(custom_header, 'base64').toString());

    if (!endpoint_access_key || !expire_on)
        return send_response(res, 200, false, 201, null, "Invalid custom header data", req.url);

    const now = new Date();
    if (new Date(expire_on) < now)
        return send_response(res, 200, false, 201, null, "Endpoint timeout reached", req.url);

    const base64_credentials = auth_header.split(' ')[1];
    const credentials = Buffer.from(base64_credentials, 'base64').toString();
    const [username, password] = credentials.split(':');

    if (!username || !password)
        return send_response(res, 200, false, 201, null, "username or password is missing", req.url);

    const get_maintanance_data = await maintananceModel.findOne({ username, endpoint_access_key }, { _id: 0, __v: 0 });

    if (!get_maintanance_data) {
        return send_response(res, 200, false, 201, null, "Invalid username or endpoint access key", req.url);
    }

    const maintanance_data_password = sha256(get_maintanance_data?._doc?.password || '');

    if (maintanance_data_password !== password)
        return send_response(res, 200, false, 201, null, "Invalid username or password", req.url);

    await maintananceModel.updateOne(
        { username: { $eq: username }, endpoint_access_key: { $eq: endpoint_access_key } },
        { $set: { maintanance_mode: maintanance } },
    );

    send_response(res, 200, true, 0, maintanance, 'Maintenance mode updated', req.url);
});


exports.is_maintanance_break_announced = catchAsyncError(async (req, res, next) => {
    const auth_header = req.headers['authorization'];
    const custom_header = req.headers['x-custom-encrypted-header'];
    if (!auth_header) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
        return send_response(res, 200, false, 201, null, "Invalid or missing authorization header", req.url);
    }

    if (!custom_header)
        return send_response(res, 200, false, 201, null, "Invalid or missing custom header", req.url);

    const { endpoint_access_key, expire_on } = JSON.parse(Buffer.from(custom_header, 'base64').toString());

    if (!endpoint_access_key || !expire_on)
        return send_response(res, 200, false, 201, null, "Invalid custom header data", req.url);

    const now = new Date();
    if (new Date(expire_on) < now)
        return send_response(res, 200, false, 201, null, "Endpoint timeout reached", req.url);

    const base64_credentials = auth_header.split(' ')[1];
    const credentials = Buffer.from(base64_credentials, 'base64').toString();
    const [username, password] = credentials.split(':');

    if (!username || !password)
        return send_response(res, 200, false, 201, null, "username or password is missing", req.url);

    const get_maintanance_data = await maintananceModel.findOne({ username, endpoint_access_key }, { _id: 0, __v: 0 });

    if (!get_maintanance_data) {
        return send_response(res, 200, false, 201, null, "Invalid username or endpoint access key", req.url);
    }

    const maintanance_data_password = sha256(get_maintanance_data?._doc?.password || '');

    if (maintanance_data_password !== password)
        return send_response(res, 200, false, 201, null, "Invalid username or password", req.url);

    send_response(res, 200, true, 0, { maintanance_mode: get_maintanance_data?.maintanance_mode || false }, 'Maintenance mode fetched', req.url);
});