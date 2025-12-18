const express = require('express');
const multer = require('multer');
const { registerUser, forgotPassword, resetPassword, getUser, resetJwtToken, registerInterviewCandidate, login, get_registration_roles, maintananceMode, is_maintanance_break_announced } = require("../controllers/authController");
const { isAuthenticatedUser } = require('../middlewares/authenticate');
const router = express.Router();
const upload = multer()

router.route('/register').post(upload.single('avatar'), registerUser);
router.route('/getuser').get(isAuthenticatedUser, getUser);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').post(resetPassword);
router.route('/refresh_token').get(resetJwtToken)
router.route('/register_candidate').post(upload.fields([{ name: "image", maxCount: 1 }]), registerInterviewCandidate);
router.route('/get_registration_roles').post(get_registration_roles);
router.route('/login').post(login)
router.route('/maintanance_mode').get(maintananceMode)
router.route('/is_maintanance_break_announced').get(is_maintanance_break_announced);

module.exports = router;