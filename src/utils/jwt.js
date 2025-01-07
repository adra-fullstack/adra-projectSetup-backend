const sendToken = (user, statusCode, res) => {

    //creating jwt token
    const token = user.getJwtToken();
    const refreshToken = user.getRefreshJwtToken();

    //setting cookies
    const options = {
        httpOnly: true,
        sameSite: 'strict'
    }

    // res.status(statusCode).cookie('token', token, options).cookie('refreshToken', refreshToken, options).json({
    //     success: true,
    //     data: user,
    //     message: "User registered successfully"

    // })
    res.status(statusCode).json({
        data: {
            success: true,
            data: user,
            message: "User registered successfully",
            error_code: 0
        }
    })
}


module.exports = sendToken;



const sendCandidateToken = async (user, statusCode, res) => {
    //creating jwt token
    const token = user.getCandidateJwtToken();
    const user_role = user?.user_role;
    console.log(user?.name,"user_role")

    res.status(200).json({
        success: true,
        data: {
            token,
            user_role
        },
        message: "Login successfully",
        error_code: 0
    })
}

module.exports = sendCandidateToken;