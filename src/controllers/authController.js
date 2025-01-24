const ErrorHandler = require("../utils/errorHandling");
const catchAsyncError = require("../middlewares/catchAsyncError");

const sendEmail = require("../utils/email");
const sendToken = require("../utils/jwt"); 
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const interviewCandidateModel = require("../models/interviewCandidateModel");
const QuestionGeneratorModel = require("../models/QuestionGeneratorModel");
const User = require("../models/userModel");
const { sha256 } = require("js-sha256");

exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { body, file } = req

    if (!file) {
        return next(new ErrorHandler("Profile image Not found", 401));
    }
    

    const { name, username, email, password, role } = body;
    const user = await User.findOne({ username })

    if (user) {
        return next(new ErrorHandler("Username already exist", 401));
    } else {
        const avatar = file.originalname;
        const newUser = await User.create({ name, username, email, password, avatar, role });
        sendToken(newUser, 201, res);

    }
});

exports.getUser = catchAsyncError(async (req, res, next) => {
    const users = await User.findById(req.user.id)

    res.status(200).json({
        success: true,
        data: users,
        message: 'user details fetched successfull'
    })
})

exports.resetJwtToken = catchAsyncError(async (req, res, next) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        return next(new ErrorHandler("No refresh token provided", 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)

    sendToken(user, 201, res);
})

exports.login = catchAsyncError(async (req, res, next) => {
    const authheader = req.headers.authorization;
    if (!authheader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
        return next(new ErrorHandler("Invalid or missing authorization header", 401));
    }

    // Basic Autherization  
    const base64Credentials = authheader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString();
    const [username, password] = credentials.split(':');
    if (!username || !password) {
        if (typeof username != Number) {
            return next(new ErrorHandler("Invalid username or password", 401));
        } else {
            return next(new ErrorHandler("Please provide both username and password", 401));
        }
    }

    //Finding users
    let candidateUser;
    let adraUser;
    if (isFinite(username)) {
        const phoneNumber = username;
        candidateUser = await interviewCandidateModel.findOne({ phoneNumber }).select('+password');
    } else {
        adraUser = await User.findOne({ username }).select('+password');
    }

    const user = candidateUser || adraUser;
    if (!user) {
        return next(new ErrorHandler("User not found", 401));
    }

    // if interview candidates 
    if (candidateUser) {
        if (candidateUser?.oneTimeLoggedin) {
            return next(new ErrorHandler(`The test has already been taken by ${candidateUser?.name}`, 401));
        }

        const isValidPassword = await user.isCandidateValidPassword(password);
        if (!isValidPassword) {
            return next(new ErrorHandler("Invalid username or password", 401));
        }
        sendToken(user, 200, res);
    }


    if (adraUser) { 
        const isValidPassword = await user.isValidPassword(password);
        if (!isValidPassword) {
            return next(new ErrorHandler("Invalid username or password", 401));
        }

        sendToken(user, 200, res);
    }
})

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("User not found with this email"), 404);
    }

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

    if (!user) {
        return next(new ErrorHandler('password reset token is invalid or expired'), 401)
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('password does not match'), 401)
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    sendToken(user, 201, res);
})

exports.registerInterviewCandidate = catchAsyncError(async (req, res, next) => {
    // const { body, file } = req
    const { body } = req

    // if (!file) {
    //     return next(new ErrorHandler("image Not found", 401));
    // }

    const { name, age, phoneNumber, email, gender, address, parentName, parentOccupation, maritalStatus, childrens, siblings, addressIfAnyCbe,
        sslcSchoolName, hscSchoolName, collegeName, sslcMarks, hscMarks, collegeMarks, canditateRole, canditateExpType,
        previousCompanyName, desigination, experience, currentSalary, expectedSalary, candidateQualification, role, remarks } = body;

    const password = sha256("Test@123")

    let candidateExperience = ""
    const user = await interviewCandidateModel.findOne({ $or: [{ phoneNumber: { $eq: phoneNumber } }, { email: { $eq: email } }] });

    if (user) {
        return next(new ErrorHandler("phone number (or) email already exist", 401));
    } else {
        // const avatar = file.originalname;
        const newUser = await interviewCandidateModel.create({
            name, age, phoneNumber, email, gender, address, password, parentName, parentOccupation, maritalStatus, childrens, siblings, addressIfAnyCbe,
            sslcSchoolName, hscSchoolName, collegeName, sslcMarks, hscMarks, collegeMarks, canditateRole, canditateExpType,
            previousCompanyName, desigination, experience, currentSalary, expectedSalary, candidateQualification, role, remarks
        });

        if (newUser.canditateExpType === 0) {
            candidateExperience = "fresher"
        }
        else if (newUser.canditateExpType > 0 && newUser.canditateExpType <= 0) {
            candidateExperience = "intermediate"
        }
        else {
            candidateExperience = "hard"
        }

        await QuestionGeneratorModel.create({
            candidate_id: newUser._id,
            candidate_role: newUser.canditateRole,
            difficulty_level: candidateExperience
        })

        res.status(200).json({
            success: true,
            data: {
                username: phoneNumber,
                password:'Test@123'
            },
            error_code: 0,
            message: 'Candidate registration success'
        })
    }
})