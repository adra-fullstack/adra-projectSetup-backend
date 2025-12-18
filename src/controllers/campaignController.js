const send_response = require("../functionPieces/send_reposnse");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { CampaignBin, CandidateBin } = require("../models/campaignBinModel");
const { CampaignModel } = require("../models/campaignModel");
const interviewCandidateModel = require("../models/interviewCandidateModel");
const ErrorHandler = require("../utils/errorHandling");
const mongoose = require("mongoose");

// Read
exports.displayCampaign = catchAsyncError(async (req, res) => {
    const [campaigns] = await CampaignModel.aggregate([
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
            $sort: {
                interview_date: -1 // 1 for ascending, -1 for descending
            }
        },
        {
            $facet: {
                data: [
                    {
                        $project: {
                            __v: 0,
                            candidates: 0,
                            question_pattern: 0
                        }
                    }
                ],
                totalCount: [
                    {
                        $count: "campaignCount"
                    }
                ]
            }
        },
        {
            $project: {
                campaignCount: { $arrayElemAt: ["$totalCount.campaignCount", 0] },
                campaign: "$data"
            }
        }
    ]);

    send_response(res, 200, true, 0, campaigns, "Campaigns fetched successfully");
})

exports.displayIndividualCampaign = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(new ErrorHandler("Invalid campaign ID", 201));

    const objectId = new mongoose.Types.ObjectId(id);
    const [get_single_campaign] = await CampaignModel.aggregate([
        {
            $match: { _id: objectId }
        },
        {
            $lookup: {
                from: "interview_candidates",
                localField: "_id",
                foreignField: "campaign_id",
                as: "candidates",
                pipeline: [
                    {
                        $lookup: {
                            from: "interview_candidate_apti_questions",
                            let: { candidateId: "$_id" },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$candidate_id", "$$candidateId"] } } },
                                { $project: { status: 1, test_EndedOn: 1, score: 1, _id: 0 } }
                            ],
                            as: "questions"
                        }
                    },
                    {
                        $addFields: {
                            status: { $arrayElemAt: ["$questions.status", 0] },
                            test_EndedOn: { $arrayElemAt: ["$questions.test_EndedOn", 0] },
                            test_score: { $arrayElemAt: ["$questions.score", 0] }
                        }
                    },
                    {
                        $project: {
                            candidate_id: "$_id",
                            age: 1,
                            name: 1,
                            email: 1,
                            gender: 1,
                            phoneNumber: 1,
                            currentSalary: 1,
                            expectedSalary: 1,
                            candidateQualification: 1,
                            experience: 1,
                            canditateExpType: 1,
                            address: 1,
                            createdAt: 1,
                            status: 1,
                            test_EndedOn: 1,
                            test_score: 1,
                            profile_photo_path: 1
                        }
                    },
                    { $sort: { createdAt: 1 } }
                ]
            }
        },
        {
            $addFields: {
                question_pattern: {
                    $map: {
                        input: "$question_pattern",
                        as: "qp",
                        in: {
                            _id: "$$qp._id",
                            question_type: "$$qp.question_type",
                            difficulty_level: "$$qp.difficulty_level",
                            questions_count: "$$qp.questions_count"
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                job_title: 1,
                question_pattern: 1,
                candidates: 1
            }
        }
    ]);

    if (!get_single_campaign) return next(new ErrorHandler("Campaign not found", 404));
    send_response(res, 200, true, 0, get_single_campaign, "Campaign retrieved successfully");
})

exports.createCampaign = catchAsyncError(async (req, res, next) => {
    const { job_title, interview_date, test_time_duration } = req.body;
    if (!job_title || !interview_date || !test_time_duration) return next(new ErrorHandler("Please fill all the fields", 201));

    const campaignDetails = await CampaignModel.create(req.body)
    send_response(res, 200, true, 0, campaignDetails, "Campaign created successfully");
})

exports.updateCampaign = catchAsyncError(async (req, res, next) => {
    const requestDetails = req.body
    const CampaignId = await CampaignModel.findById({ _id: requestDetails._id })

    if (!CampaignId) return next(new ErrorHandler("Campaign not found", 201))
    const updated_campaign = await CampaignModel.findByIdAndUpdate(requestDetails._id, requestDetails, { new: true })

    send_response(res, 200, true, 0, updated_campaign, "Campaign updated successfully");
})

exports.deleteCampaign = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const CampaignId = await CampaignModel.findById({ _id: id })
    if (!CampaignId) return next(new ErrorHandler("Campaign not found", 201))

    await CampaignModel.findOneAndDelete(CampaignId)
    send_response(res, 200, true, 0, {}, "Campaign deleted successfully");
})

exports.restoreCampaign = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    await CampaignBin.restoreCampaign(id)
    send_response(res, 200, true, 0, {}, "Campaign restored successfully");
})

// Campaign Pattern
exports.createCampaignPattern = catchAsyncError(async (req, res, next) => {
    const { campaign_id, question_type, difficulty_level, questions_count } = req.body;
    const requiredFields = { campaign_id, question_type, difficulty_level, questions_count };

    // Check for missing fields
    const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => value === undefined || value === null || value === '')
        .map(([key]) => key);
    if (missingFields.length) return next(new ErrorHandler(`Missing required fields: ${missingFields.join(", ")}`, 201))

    // Check if campaign exists
    const campaign = await CampaignModel.findById(campaign_id);
    if (!campaign) return next(new ErrorHandler("Campaign not found", 201));

    // Check for duplicate pattern
    const isDuplicate = campaign.question_pattern.some(q =>
        q.question_type === question_type &&
        q.difficulty_level === difficulty_level
    );

    if (isDuplicate) return next(new ErrorHandler("Question pattern already exists for this campaign", 201));

    // Push new dynamic question
    campaign.question_pattern.push({ question_type, difficulty_level, questions_count });
    const updatedCampaign = await campaign.save();
    const cleanData = await CampaignModel.findById(updatedCampaign._id).select("-created_at -interview_date -__v");

    send_response(res, 200, true, 0, cleanData, "Campaign pattern created successfully");
})

exports.updateCampaignPattern = catchAsyncError(async (req, res, next) => {
    const { campaign_id, question_id, question_type, difficulty_level, questions_count } = req.body;
    const missingFields = ['campaign_id', 'question_id', 'question_type', 'difficulty_level', 'questions_count'].filter(field => !req.body[field]);
    if (missingFields.length) return next(new ErrorHandler(`Missing required fields: ${missingFields.join(", ")}`, 201))

    const campaign = await CampaignModel.findById(campaign_id);
    if (!campaign) return next(new ErrorHandler("Campaign not found", 201));

    // Update specific dynamic question by its _id
    const updatedCampaign = await CampaignModel.findOneAndUpdate(
        {
            _id: campaign_id,
            "question_pattern._id": question_id
        },
        {
            $set: {
                "question_pattern.$.question_type": question_type,
                "question_pattern.$.difficulty_level": difficulty_level,
                "question_pattern.$.questions_count": questions_count
            }
        },
        { new: true }
    ).select("-created_at -interview_date -__v");

    if (!updatedCampaign) return next(new ErrorHandler("Dynamic question not found", 201));
    send_response(res, 200, true, 0, updatedCampaign, "Pattern updated successfully");
});

exports.deleteCampaignPattern = catchAsyncError(async (req, res, next) => {
    const { campaign_id, question_id } = req.query;
    if (!campaign_id || !question_id) return next(new ErrorHandler("campaign_id and question_id are required", 201));

    // Check if campaign exists
    const campaign = await CampaignModel.findById(campaign_id);
    if (!campaign) return next(new ErrorHandler("Campaign not found", 201));

    // Check if the specific dynamic question exists
    const isQuestionExists = campaign.question_pattern.some((q) => q._id.toString() === question_id);
    if (!isQuestionExists) return next(new ErrorHandler("Question pattern not found", 201));

    // Perform deletion
    const updatedCampaign = await CampaignModel.findByIdAndUpdate(
        campaign_id,
        {
            $pull: {
                question_pattern: { _id: question_id }
            }
        },
        { new: true }
    ).select("-created_at -interview_date -__v");

    send_response(res, 200, true, 0, updatedCampaign, "Question pattern deleted successfully");
});

exports.campaignCandidatesDetails = catchAsyncError(async (req, res, next) => {
    const { candidate_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(candidate_id)) return next(new ErrorHandler("candidate_id required", 201));

    const objectId = new mongoose.Types.ObjectId(candidate_id);
    const [candidate_data] = await interviewCandidateModel.aggregate([
        {
            $match: { _id: objectId }
        },
        {
            $lookup: {
                from: "interview_candidate_apti_questions",
                localField: "_id",
                foreignField: "candidate_id",
                as: "question_data"
            }
        },
        {
            $addFields: {
                status: { $arrayElemAt: ["$question_data.status", 0] },
                test_StartedOn: { $arrayElemAt: ["$question_data.test_StartedOn", 0] },
                test_EndedOn: { $arrayElemAt: ["$question_data.test_EndedOn", 0] },
                test_score: { $arrayElemAt: ["$question_data.score", 0] },
                assigned_questions: {
                    $map: {
                        input: { $arrayElemAt: ["$question_data.assigned_questions", 0] },
                        as: "q",
                        in: {
                            question: "$$q.question",
                            options: "$$q.options",
                            answer: "$$q.answer",
                            candidate_answer: "$$q.candidate_answer",
                            difficulty_level: "$$q.difficulty_level",
                            question_type: "$$q.question_type"
                        }
                    }
                }
            }
        },
        {
            $project: {
                campaign_id: 0,
                password: 0,
                user_role: 0,
                oneTimeLoggedin: 0,
                question_data: 0,
                __v: 0,
            }
        }
    ]);

    if (!candidate_data) return next(new ErrorHandler("Campaign not found", 201));
    send_response(res, 200, true, 0, candidate_data, "Campaign retrieved successfully");
})


//candidates
// exports.createCandidates = catchAsyncError(async (req, res) => {
//     const candidates = await interviewCandidateModel.create(req.body)
//     send_response(res, 200, true,
//         {
//             campaignCount: candidates.length,
//             campaign: candidates
//         },
//         "Candidates created successfully");
// })

// exports.displayCandidates = catchAsyncError(async (req, res) => {
//     const candidates = await interviewCandidateModel.find()
//     send_response(res, 200, true, 0,
//         {
//             Candidates_count: candidates.length,
//             campaign: candidates
//         },
//         "Candidates fetched successfully"
//     );
// })

// exports.updateCandidate = catchAsyncError(async (req, res, next) => {
//     const requestDetails = req.body
//     const CandidateId = await interviewCandidateModel.findById({ _id: requestDetails._id })

//     if (!CandidateId) return next(new ErrorHandler("Candidate not found", 201))

//     await interviewCandidateModel.findByIdAndUpdate(requestDetails._id, requestDetails, { new: true })
//     const Candidate = await interviewCandidateModel.find()
//     send_response(res, 200, true, 0,
//         {
//             candidateCount: Candidate.length,
//             candidate: Candidate
//         },
//         "Candidate updated successfully"
//     );
// })

// exports.updateCandidateStatus = catchAsyncError(async (req, res, next) => {
//     const requestDetails = req.body
//     const CandidateId = await CandidateModel.findById({ _id: requestDetails._id })

//     if (!CandidateId) return next(new ErrorHandler("Candidate not found", 201))
//     await CandidateModel.findByIdAndUpdate(requestDetails._id, requestDetails, { new: true })
//     const Candidate = await CandidateModel.find()

//     send_response(res, 200, true, 0,
//         {
//             candidateCount: Candidate.length,
//             candidate: Candidate
//         },
//         "Candidate status updated successfully"
//     );
// })

exports.deleteCandidates = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const candidateId = await interviewCandidateModel.findById({ _id: id })
    if (!candidateId) return next(new ErrorHandler("Candidate not found", 201))

    await interviewCandidateModel.findOneAndDelete({ _id: candidateId })
    send_response(res, 200, true, 0, {}, "Candidate deleted successfully");
})

exports.restoreCandidates = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    await CandidateBin.restoreCandidate(id)
    send_response(res, 200, true, 0, {}, "Candidate restored successfully");
})