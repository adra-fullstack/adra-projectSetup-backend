const mongoose = require("mongoose");
const maintananceSchema = new mongoose.Schema({
    maintanance_mode : {
        type: Boolean,
        default: false,
    }
});

const maintananceModel = mongoose.model("maintanance_mode", maintananceSchema);
module.exports = maintananceModel;