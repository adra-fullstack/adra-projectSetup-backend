const mongoose = require("mongoose");
const validator = require('validator');
const bycrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { type } = require("os");

const interviewCandidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name required"]
    },
    user_role: {
        type: String,
        default: "interview_candidate"
    },
    age: {
        type: Number,
        required: [true, "age required"]
    },
    phoneNumber: {
        type: Number,
        required: [true, "phoneNumber required"],
        validate: {
            validator: function (val) {
                return val.toString().length === 10;
            },
            message: "Mobile number should be 10 digit."
        }
    },
    password: String,
    oneTimeLoggedin: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        required: [true, "Please enter email"],
        maxLength: [30, "Name should not exceed 30 characters"],
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    gender: {
        type: String,
        required: [true, "gender required"]
    },
    address: {
        type: String,
        required: [true, "address required"]
    },
    parentName: {
        type: String,
        required: [true, "parentName required"]
    },
    parentOccupation: {
        type: String,
        required: [true, "parentOccupation required"]
    },
    maritalStatus: {
        type: String,
        required: [true, "maritalStatus required"]
    },
    childrens: {
        type: String
    },
    siblings: {
        type: String
    },
    addressIfAnyCbe: {
        type: String
    },
    sslcSchoolName: {
        type: String,
        required: [true, "sslcSchoolName required"]
    },
    hscSchoolName: {
        type: String,
        required: [true, "hscSchoolName required"]
    },
    collegeName: {
        type: String,
        required: [true, "collegeName required"]
    },
    sslcMarks: {
        type: Number,
        required: [true, "sslcMarks required"]
    },
    hscMarks: {
        type: Number,
        required: [true, "hscMarks required"]
    },
    collegeMarks: {
        type: Number,
        required: [true, "collegeMarks required"]
    },
    canditateRole: {
        type: String,
        required: [true, "canditateRole required"]
    },
    canditateExpType: {
        type: String,
        // required: [true, "canditateExpType required"]
    },
    candidateQualification: String,
    previousCompanyName: {
        type: String,
    },
    desigination: {
        type: String,
    },
    experience: {
        type: String,
        required: [true, "experience required"]
    },
    currentSalary: {
        type: String,
        required: [true, "currentSalary required"]
    },
    expectedSalary: {
        type: String,
        required: [true, "expectedSalary required"]
    },
    remarks: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    password: String,
    token: String,
    resetPasswordToken: String,
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date
})


interviewCandidateSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    this.password = await bycrypt.hash(this.password, 10)
})

interviewCandidateSchema.methods.getCandidateJwtToken = function () {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    })
}

interviewCandidateSchema.methods.getCandidateRefreshJwtToken = function () {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET)
}

interviewCandidateSchema.methods.isCandidateValidPassword = async function (enteredPassword) {
    return await bycrypt.compare(enteredPassword, this.password)
}

interviewCandidateSchema.methods.getResetToken = function () {
    //Generate token
    const token = crypto.randomBytes(20).toString('hex');

    //Generate Hash and set ro resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex')

    //Set token expire time
    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000;

    return token
}

const interviewCandidateModel = mongoose.model('interview_candidates', interviewCandidateSchema)

module.exports = interviewCandidateModel