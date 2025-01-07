const mongoose = require('mongoose');
const validator = require('validator');
const bycrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter name"],
        maxLength: [20, "Name should not exceed 20 characters"]
    },
    email: {
        type: String,
        required: [true, "Please enter email"],
        maxLength: [30, "Name should not exceed 30 characters"],
        unique: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    username:{
        type:String,
        require:[true,"Please enter username"],
        maxLength:[20,"Username should not exceed 20 characters"]
    },
    password: {
        type: String,
        required: [true, "Please enter password"],
        maxLength: [20, "Password should not exceed 20 characters"],
        select: false
    },
    avatar: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'User'
    },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        next();
    }

    this.password = await bycrypt.hash(this.password, 10)
})

userSchema.methods.getJwtToken = function(){
    return jwt.sign({id: this.id}, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_TIME
    })
} 

userSchema.methods.getRefreshJwtToken = function(){
    return jwt.sign({id: this.id}, process.env.JWT_SECRET)
} 

userSchema.methods.isValidPassword = async function(enteredPassword){
    return await bycrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getResetToken  = function(){
    //Generate token
    const token = crypto.randomBytes(20).toString('hex');

    //Generate Hash and set ro resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex')

    //Set token expire time
    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000;

    return token
}

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;