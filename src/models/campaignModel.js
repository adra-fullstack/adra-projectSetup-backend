const mongoose = require("mongoose")

const campaignSchema = new mongoose.Schema({
    job_title: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    interview_date: {
        type: Date
    },
    is_enabled: {
        type: Boolean,
        default: true
    },
    dynamic_questions: {
        type: Array,
        default: []
    }
})

const CampaignModel = mongoose.model("interview_campaigns", campaignSchema)
module.exports = { CampaignModel }