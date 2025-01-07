const mongoose = require("mongoose")

const CandidateSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: Number,
    education: String,
    location: String,
    current_role: String,
    resume: {
        type: Object
    },
    questions: [{
        question: String,
        answer: String
    }],

    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'interview_campaigns',
        required : true
    },
    candidate_entry: String,
    candidate_status: String,
    candidate_remarks: String
});

const campaignSchema = new mongoose.Schema({
    job_title: String,
    created_at: {
        type: Date,
        default: Date.now()
    },
    interview_date: {
        type: Date
    },
    total_candidates: {
        type : Number,
        default : 0
    },

    confirmed_candidates: {
        type : Number,
        default : 0
    },

    interview_not_confirmed_candidates: {
        type : Number,
        default : 0
    },

    pending_candidates: {
        type : Number,
        default : 0
    },

    reviewed_questions: [{
        question: String,
        answer: String
    }]

})

const CampaignModel = mongoose.model("interview_campaigns", campaignSchema)
const CandidateModel = mongoose.model('candidates', CandidateSchema);
module.exports = {CampaignModel , CandidateModel}