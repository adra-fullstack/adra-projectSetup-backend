// const sendUserToken = (user, statusCode, res) => {
//     //creating jwt token
//     // const refreshToken = user.getRefreshJwtToken();
//     const token = user.getJwtToken();
//     const user_role = user?.user_role; 

//     res.status(statusCode).json({
//         success: true,
//         data: {
//             token,
//             user_role
//         },
//         message: "Login successfully",
//         error_code: 0
//     })
// }
// module.exports = sendUserToken;



const sendToken = async (user, statusCode, res) => {
    //creating jwt token
    let token;
    switch (user?.user_role) {
        case "admin":
            token = user.getJwtToken();
            break;

        case "interview_candidate":
            token = user.getCandidateJwtToken();
            break;

        default:
            break;
    }
    const user_role = user?.user_role; 

    res.status(statusCode).json({
        success: true,
        data: {
            token,
            user_role
        },
        message: "Login successfully",
        error_code: 0
    })
}
module.exports = sendToken;