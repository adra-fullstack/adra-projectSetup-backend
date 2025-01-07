const schedule = require('../models/scheduleModel');

const ScheduleSocketCtrl = async (socket, data) => {
    const { day, role, userId, description, id, label, time, title } = data;

    const create = await schedule.create({ userId, role, day, description, id, label, time, title })

    socket.emit('schedule-create-response', { day, role, userId, description, id, label, time, title })
}

module.exports = ScheduleSocketCtrl