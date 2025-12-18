const express = require('express');
const multer = require('multer')
const { createQuestions, getQuestionTypes, updateQuestions, deleteQuestions, uploadQuestionsUsingCsv, getAllQuestions, getRandomQuestion, validationCandidateAnswers, getInterviewCandidateStatus, generateSampleTest, updateInvolvingInMalpractice, deleteDuplicateQuestions } = require('../controllers/QuestionsController');
const { isAuthenticatedUser, isautherizeRoles } = require('../middlewares/authenticate');
const router = express.Router();
const upload = multer();


router.route("/get_question_types").get(getQuestionTypes);
router.route("/create_questions").post(isAuthenticatedUser, createQuestions);
router.route("/update_question").put(isAuthenticatedUser, updateQuestions);
router.route("/delete_question/:id").delete(isAuthenticatedUser, deleteQuestions);
router.route("/upload_csv_questions").post(upload.single('file'), uploadQuestionsUsingCsv);
// router.route("/upload_csv_questions").post(isAuthenticatedUser, isautherizeRoles("Hr"), upload.single('file'), uploadQuestionsUsingCsv);
router.route("/get_all_questions")
    .get(isAuthenticatedUser, getAllQuestions)
    .post(isAuthenticatedUser, getAllQuestions)

router.route("/generate_random_question").get(isAuthenticatedUser, getRandomQuestion);
router.route("/update_involving_in_malpractice").post(isAuthenticatedUser, updateInvolvingInMalpractice);
router.route("/validate_answers").post(isAuthenticatedUser, validationCandidateAnswers);
router.route("/get_interview_candidate_status").get(getInterviewCandidateStatus)
router.get("/campaign/:id/generate_sample_test", generateSampleTest)
router.delete("/delete_duplicate_questions", deleteDuplicateQuestions)

module.exports = router;