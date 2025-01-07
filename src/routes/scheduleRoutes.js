const express = require('express');
const multer=require('multer')
const { isAuthenticatedUser, isautherizeRoles } = require('../middlewares/authenticate');
const { createSchedule, updateSchedule, getSchedules, uploadShortlistedCandidateUsingCsv } = require('../controllers/scheduleController');
const router = express();
const upload = multer();

router.route("/create_schedule").post(isAuthenticatedUser,createSchedule)
router.route("/update_schedule").post(isAuthenticatedUser,updateSchedule)
router.route("/get_schedules").get(isAuthenticatedUser,getSchedules)
router.route("/upload_candidate_csv").post(upload.single('file'),isAuthenticatedUser,uploadShortlistedCandidateUsingCsv)


module.exports = router;