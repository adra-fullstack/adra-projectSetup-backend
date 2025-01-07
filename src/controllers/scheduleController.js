const catchAsyncError = require("../middlewares/catchAsyncError")
const schedule = require('../models/scheduleModel');
const ErrorHandler = require("../utils/errorHandling");
const csv = require('csvtojson');

exports.createSchedule = catchAsyncError(async (req, res, next) => {
    const { day, description, id, label, time, title } = req.body;
    const role = req.user.role
    const userId = req.user.id

    const create = await schedule.create({ userId, role, day, description, id, label, time, title })
    res.status(200).json({
        success: true,
        data: create
    })
})

exports.updateSchedule = catchAsyncError(async (req, res, next) => {
    let updateSchedule = await schedule.findById(req.body._id)
    if (!updateSchedule) {
        return next(new ErrorHandler('schedule not found', 404))
    }

    const updatedschedule = await schedule.findByIdAndUpdate(req.body._id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(201).json({
        success: true,
        data: updatedschedule,
        message: "schedule updated successfully"
    })
})

exports.getSchedules = catchAsyncError(async (req, res, next) => {
    const { user } = req;

    if (!user) {
        return next(new ErrorHandler('you cant get schedule details', 404))
    }

    let getSchedules;

    if (user.role === "Hr") {
        getSchedules = await schedule.find({ role: "Hr" })

        res.status(201).json({
            success: true,
            data: getSchedules,
            message: "schedule fetched successfully"
        })
    }
})

exports.uploadShortlistedCandidateUsingCsv = catchAsyncError(async (req, res, next) => {
    const { file } = req; 
    if (!file) {
        return next(new ErrorHandler("No csv found", 404))
    }

    const fileType = file.mimetype.split('/')[1];
    if (fileType === "csv") {
        const jsonArray = await csv().fromString(req.file.buffer.toString());
        const filterNonEmptyObject = jsonArray.filter((v) => {
            return v.name!='' && v.email!='' && v.phone!='' && v.status!=''
        })

        if (filterNonEmptyObject.length) {
            const makingNewArray = filterNonEmptyObject.map((v) => {
                return {
                    name: v.name,
                    email: v.email,
                    mobile: v.phone,
                    status: v.status,
                    current_role: v.current_role,
                    education: v.education,
                    job_title: v.job_title,
                    resume: v.resume
                }
            })

            res.status(200).json({
                success: true,
                data: makingNewArray,
                message: 'Candidates csv uploaded successfully'
            })
        } else {
            res.status(400).json({
                success: false,
                data: filterNonEmptyObject,
                message: 'The uploaded csv file does not contain following keys Like:[name,email,mobile,status,current_role,education,job_title,resume]'
            })
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'The uploaded file was not a matched format'
        })
    }
})