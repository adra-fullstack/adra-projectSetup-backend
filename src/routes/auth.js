const express = require('express');
const multer = require('multer');
const { registerUser, forgotPassword, resetPassword, getUser, resetJwtToken, registerInterviewCandidate, login } = require("../controllers/authController");
const { isAuthenticatedUser } = require('../middlewares/authenticate');
const router = express.Router();
const upload = multer() 


router.route('/register').post(upload.single('avatar'),registerUser);
router.route('/getuser').get(isAuthenticatedUser,getUser);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').post(resetPassword);
router.route('/refresh_token').get(resetJwtToken)
router.route('/register_candidate').post(registerInterviewCandidate);
router.route('/login').post(login)


module.exports = router;