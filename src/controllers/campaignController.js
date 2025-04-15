const { CampaignModel, CandidateModel } = require("../models/campaignModel")

// Read
exports.displayCampaign = async (req, res) => {
    try {
        const campaignDetails = await CampaignModel.find()

        res.status(200).json({
            success: true,
            error_code: 0,
            data: {
                campaignCount: campaignDetails.length,
                campaign: campaignDetails,
            },
            message: "Campaign fetched successfully"
        })

    } catch (error) {
        res.status(500).json({ message: "Internal Server errror" })
    }
}

exports.displayCandidates = async (req, res) => {
    try {
        const candidates = await CandidateModel.find()

        res.status(200).json({
            success: true,
            Candidates_count: candidates.length,
            campaign: candidates,
            message: "Candidates fetched successfully"
        })

    } catch (error) {
        res.status(500).json({ message: "Internal Server errror" })
    }
}

exports.candidatesSpecificCampaign = async (req, res) => {
    try {

        const requestParams = req.body
        const CampaignId = await CampaignModel.findById({ _id: requestParams.campaign_id })

        if (!CampaignId) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found"
            })
        }

        const specificCandidates = await CandidateModel.find({ campaign_id: requestParams.campaign_id }).forEach((data) => data);

        res.status(200).json({
            success: true,
            Candidates_count: specificCandidates.length,
            campaign: specificCandidates,
            message: "Candidates fetched successfully"
        })

    } catch (error) {
        res.status(500).json({ message: "Internal Server errror" })
    }
}

// Create
exports.createCampaign = async (req, res) => {
    const { job_title, interview_date } = req.body;
    if (!job_title || !interview_date) {
        return res.status(400).json({
            success: false,
            message: "Please fill all the fields"
        })
    }

    try {
        const campaignDetails = await CampaignModel.create(req.body)

        res.status(200).json({
            success: true,
            data: campaignDetails,
            message: "Campaign created successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server errror"
        })

    }
}

exports.createCandidates = async (req, res) => {
    try {
        const candidates = await CandidateModel.create(req.body)

        res.status(200).json({
            success: true,
            campaignCount: candidates.length,
            campaign: candidates,
            message: "Candidates created successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server errror"
        })

    }
}

// Update
exports.updateCampaign = async (req, res) => {
    try {

        const requestDetails = req.body

        const CampaignId = await CampaignModel.findById({ _id: requestDetails._id })

        if (!CampaignId) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found"
            })
        }

        await CampaignModel.findByIdAndUpdate(requestDetails._id, requestDetails, { new: true })

        const Campaign = await CampaignModel.find()

        res.status(200).json({
            success: true,
            campaignCount: Campaign.length,
            campaign: Campaign,
            message: "Campaign updated successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server errror"
        })

    }
}

exports.updateCandidate = async (req, res) => {
    try {

        const requestDetails = req.body

        const CandidateId = await CandidateModel.findById({ _id: requestDetails._id })

        if (!CandidateId) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            })
        }

        await CandidateModel.findByIdAndUpdate(requestDetails._id, requestDetails, { new: true })

        const Candidate = await CandidateModel.find()

        res.status(200).json({
            success: true,
            candidateCount: Candidate.length,
            candidate: Candidate,
            message: "Candidate updated successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server errror"
        })

    }
}

// update candidate status
exports.updateCandidateStatus = async (req, res) => {
    try {

        const requestDetails = req.body

        const CandidateId = await CandidateModel.findById({ _id: requestDetails._id })

        if (!CandidateId) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            })
        }

        await CandidateModel.findByIdAndUpdate(requestDetails._id, requestDetails, { new: true })

        const Candidate = await CandidateModel.find()

        res.status(200).json({
            success: true,
            candidateCount: Candidate.length,
            candidate: Candidate,
            message: "Candidate updated successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server errror"
        })

    }
}



// Delete
exports.deleteCandidates = async (req, res) => {
    try {
        const candidateId = await CandidateModel.findById({ _id: req.body.id })

        if (!candidateId) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            })
        }


        await CandidateModel.findByIdAndDelete(candidateId)
        const Candidates = await CandidateModel.find()

        res.status(200).json({
            success: true,
            Candidates_count: Candidates.length,
            candidate: Candidates,
            message: "Candidate deleted successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server errror"
        })

    }
}

exports.deleteCampaign = async (req, res) => {
    try {
        const CampaignId = await CampaignModel.findById({ _id: req.body.id })

        if (!CampaignId) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found"
            })
        }

        await CampaignModel.findByIdAndDelete(CampaignId)
        const Campaign = await CampaignModel.find()
        res.status(200).json({
            success: true,
            campaignCount: Campaign.length,
            Campaign: Campaign,
            message: "Campaign deleted successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server errror"
        })

    }
}