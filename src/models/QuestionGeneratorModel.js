const mongoose = require("mongoose");

const QuestionGeneratorSchema = new mongoose.Schema({
    candidate_id: mongoose.Schema.Types.ObjectId,
    candidate_role: String,
    difficulty_level: String,
    assigned_questions: Array,
    if_question_assigned: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "Not Started"
    },
    test_StartedOn: {
        type: Date
    },
    test_EndedOn: {
        type: Date
    },
})

const QuestionGeneratorModel = mongoose.model('interview_candidate_apti_questions', QuestionGeneratorSchema);

module.exports = QuestionGeneratorModel;