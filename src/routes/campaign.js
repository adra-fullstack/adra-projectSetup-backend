const { displayCampaign, displayIndividualCampaign, createCampaign, createCandidates, deleteCandidates,
    displayCandidates, deleteCampaign, updateCampaign, updateCandidate, updateCandidateStatus,
    createCampaignPattern, updateCampaignPattern,
    deleteCampaignPattern, campaignCandidatesDetails,
    restoreCampaign, restoreCandidates

} = require("../controllers/campaignController");

const express = require("express")
const route = express.Router()


route.get("/campaign", displayCampaign)
    .get("/campaign/:id", displayIndividualCampaign)
    .post("/campaign", createCampaign)
    .put("/campaign", updateCampaign)
    .delete("/delete_campaign/:id", deleteCampaign)
    .get("/restore_campaign/:id", restoreCampaign)


route.post("/campaign_question_pattern", createCampaignPattern)
    .put("/campaign_question_pattern", updateCampaignPattern)
    .delete("/campaign_question_pattern", deleteCampaignPattern)

route.get("/display_campaign_candidate_details/:candidate_id", campaignCandidatesDetails)

// route.get("/display_candidates", displayCandidates)
// route.post("/create_candidates", createCandidates)
// route.put("/update_candidate", updateCandidate)
// route.put("/update_candidate_status", updateCandidateStatus)

route.delete("/delete_candidate/:id", deleteCandidates)
    .get("/restore_candidate/:id", restoreCandidates)

module.exports = route