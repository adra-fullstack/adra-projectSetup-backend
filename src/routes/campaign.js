const { displayCampaign, displayIndividualCampaign, createCampaign, createCandidates, deleteCandidates,
    displayCandidates, deleteCampaign, updateCampaign, updateCandidate, updateCandidateStatus,
    candidatesSpecificCampaign
} = require("../controllers/campaignController");

const express = require("express")
const route = express.Router()



route.get("/campaign", displayCampaign)
    .get("/campaign/:id", displayIndividualCampaign)
    .post("/campaign", createCampaign)
    .put("/campaign", updateCampaign)
    .delete("/delete_campaign", deleteCampaign)



route.get("/display_candidates", displayCandidates)
route.post("/create_candidates", createCandidates)
route.delete("/delete_candidate", deleteCandidates)
route.put("/update_candidate", updateCandidate)
route.put("/update_candidate_status", updateCandidateStatus)
route.get("/individual_campaign", candidatesSpecificCampaign)

module.exports = route