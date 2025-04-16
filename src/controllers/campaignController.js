const { CampaignModel, CandidateModel } = require("../models/campaignModel")
const ErrorHandler = require("../utils/errorHandling");
const mongoose = require("mongoose");

// Read
exports.displayCampaign = async (req, res) => {
    try {
        const campaigns = await CampaignModel.aggregate([
            {
                $lookup: {
                    from: "interview_candidates",
                    localField: "_id",
                    foreignField: "campaign_id",
                    as: "candidates"
                }
            },
            {
                $addFields: {
                    no_of_candidates: { $size: "$candidates" }
                }
            },
            {
                $project: {
                    __v: 0,
                    candidates: 0,
                    dynamic_questions: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            error_code: 0,
            data: {
                campaignCount: campaigns.length,
                campaign: campaigns,
            },
            message: "Campaign fetched successfully"
        });

    } catch (error) {
        console.error("Error fetching campaign:", error);
        res.status(500).json({
            success: false,
            error_code: 1,
            message: "Internal Server Error"
        });
    }
}

exports.displayIndividualCampaign = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return next(new ErrorHandler("Invalid campaign ID", 400));

        const objectId = new mongoose.Types.ObjectId(id);
        const get_single_campaign = await CampaignModel.aggregate([
            {
                $match: { _id: objectId }
            },
            {
                $lookup: {
                    from: "interview_candidates",
                    localField: "_id",
                    foreignField: "campaign_id",
                    as: "candidates"
                }
            },
            {
                $project: {
                    __v: 0,
                    is_enabled: 0,
                    interview_date:0
                }
            }
        ]);

        if (!get_single_campaign) return next(new ErrorHandler("Campaign not found", 404));

        res.status(200).json({
            error_code: 0,
            success: true,
            data: get_single_campaign,
            message: "Campaign retrieved successfully"
        });
    } catch (error) {
        return next(new ErrorHandler(error.message || "Something went wrong", 500));
    }
};

exports.createCampaign = async (req, res) => {
    try {
        const { job_title, interview_date } = req.body;
        if (!job_title || !interview_date) {
            return res.status(400).json({
                success: false,
                error_code: 400,
                message: "Please fill all the fields"
            })
        }
        const campaignDetails = await CampaignModel.create(req.body)

        res.status(200).json({
            success: true,
            data: campaignDetails,
            error_code: 0,
            message: "Campaign created successfully"
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            error_code: 500,
            message: "Internal Server errror"
        })

    }
}

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