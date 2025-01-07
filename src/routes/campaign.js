const express = require("express")
const { displayCampaign, createCampaign, createCandidates, deleteCandidates, displayCandidates, deleteCampaign, updateCampaign, updateCandidate, updateCandidateStatus, candidatesSpecificCampaign } = require("../controllers/campaignController")

const route = express.Router()

route.get("/display_campaign", displayCampaign)
route.get("/display_candidates", displayCandidates)
route.post("/create_campaign", createCampaign)
route.post("/create_candidates", createCandidates)
route.delete("/delete_candidate", deleteCandidates)
route.delete("/delete_campaign", deleteCampaign)
route.put("/update_campaign", updateCampaign)
route.put("/update_candidate", updateCandidate)
route.put("/update_candidate_status", updateCandidateStatus)
route.get("/campaign_specific_candidates", candidatesSpecificCampaign)

module.exports = route