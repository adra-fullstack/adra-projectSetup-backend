const { aesEncrypt } = require("../security/crypto/crypto");

function send_response(response, statusCode, success, error_code, data, message, req_url) {
    let response_date = data;
    let disable_restriction_for = false;

    if (req_url)
        disable_restriction_for = ["/maintanance_mode?maintanance=true", "/maintanance_mode?maintanance=false", "/is_maintanance_break_announced"].includes(req_url);

    if (process.env.NODE_ENV === "production" && !disable_restriction_for) {
        response_date = aesEncrypt({
            success,
            error_code,
            data,
            message
        })
    }
    else {
        response_date = {
            success,
            error_code,
            data,
            message
        }
    }

    if (success) console.log(`Response, statusCode: ${statusCode} , success: ${success}, error_code: ${error_code}, message: ${message}`);
    else console.error(`Error, statusCode: ${statusCode} , success: ${false}, message: ${message}`);
    return response.status(statusCode).json(response_date);
}

module.exports = send_response;