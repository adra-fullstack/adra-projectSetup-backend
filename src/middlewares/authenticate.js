const interviewCandidateModel = require("../models/interviewCandidateModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandling");
const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
    const token = req.headers['authorization'];
    const tokenWithoutBearer = token.split(' ')[1];

    if (!tokenWithoutBearer) {
        return next(new ErrorHandler("Login first to handle this resource", 401));
    }

    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    if (!decoded) {
        return next(new ErrorHandler('Session expired log in again', 401))
    }

    const user = await interviewCandidateModel.findById(decoded?.id);
    if (!user) {
        return next(new ErrorHandler('User not found', 401))
    }

    req.user = user;
    next();
});


exports.isautherizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role ${req.user.role} is not allowed`, 401))
        }
        next()
    }
};