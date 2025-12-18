const send_response = require("../functionPieces/send_reposnse");

const sendToken = async (user, statusCode, res) => {
    //creating jwt token
    let user_data = {};
    switch (user?.user_role) {
        case "admin":
            user_data.token = user.getJwtToken();
            break;

        case "interview_candidate":
            user_data.token = user.getCandidateJwtToken();
            break;

        default:
            break;
    }
    user_data.user_role = user?.user_role;
    if (user?.user_role === "interview_candidate") {
        user_data.involved_in_tab_switching = user?.involved_in_tab_switching;
        user_data.testEndOn = user?.testEndOn;
    }

    send_response(res, statusCode, true, 0, user_data, "Login successfully");
}
module.exports = sendToken;