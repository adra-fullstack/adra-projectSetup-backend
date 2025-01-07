const ScheduleSocketCtrl = require("../socket_controller/ScheduleSocketCtrl");


const socket = (socket) => {     

    socket.on("schedule-create-request",(data)=>{
        ScheduleSocketCtrl(socket,data)
    })
}

module.exports = socket;