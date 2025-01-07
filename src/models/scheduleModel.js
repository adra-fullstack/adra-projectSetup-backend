const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    day:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:["description required",true]
    },
    id:{
        type:Number,
        required:true 
    },
    label:{
        type:String,
        required:["label required",true]
    },
    time:{
        type:String,
        required:["time required",true]
    },
    title:{
        type:String,
        required:["title required",true]
    },
    role:{
        type:String,
        required:["role required",true]
    },
    userId:{
        type: mongoose.SchemaTypes.ObjectId,
        required:true
    }
})

const scheduleModel = mongoose.model("schedule",scheduleSchema);

module.exports = scheduleModel;