const { default: mongoose } = require('mongoose');
const { HrInterviewFilter } = require('../functionPieces/HrInterviewFilter');
const send_response = require('../functionPieces/send_reposnse');
const catchAsyncError = require('../middlewares/catchAsyncError');
const { CampaignModel } = require('../models/campaignModel');
const interviewCandidateModel = require('../models/interviewCandidateModel');
const mcqquestionModel = require('../models/McqQuestionsModel');
const QuestionGeneratorModel = require('../models/QuestionGeneratorModel');
const ErrorHandler = require('../utils/errorHandling');
const csv = require('csvtojson');
const { ObjectId } = require('mongodb');

// Questions CRUD 
exports.createQuestions = catchAsyncError(async (req, res, next) => {
    const { flag, data } = req.body;
    const questionAddedBy = req.user.role;
    const userId = req.user.id;

    if (flag !== "mcq") next(new ErrorHandler("flag required Ex:aptitude,reasoning,technical question", 201))
    else {
        const add_UserId_And_AddedBy = data.map((v) => {
            return { ...v, questionAddedBy, userId }
        })

        const questions = await mcqquestionModel.insertMany(add_UserId_And_AddedBy);
        send_response(res, 200, true, 0, questions, "Question insterted successfully");
    }
});

exports.updateQuestions = catchAsyncError(async (req, res, next) => {
    const { body } = req;
    if (!body) return next(new ErrorHandler("Question id required", 201))

    const validatingQuestion_byId = await mcqquestionModel.findById(body._id)
    if (!validatingQuestion_byId) return next(new ErrorHandler("Question not found", 201))

    const updateQuestion = await mcqquestionModel.findByIdAndUpdate(body._id, body, {
        new: true,
        runValidators: true
    })
    send_response(res, 200, true, 0, updateQuestion, "Question updated successfully");
})

exports.deleteQuestions = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { question_type } = req.body;

    if (!id) return next(new ErrorHandler("question_id required", 201))
    if (!question_type) return next(new ErrorHandler("question_type required", 201))

    const deleteQuestion = await mcqquestionModel.findById(id)
    if (!deleteQuestion) return next(new ErrorHandler("Questions not found", 201))

    await mcqquestionModel.findByIdAndDelete(id);
    const quesData = await HrInterviewFilter(question_type);
    send_response(res, 200, true, 0, quesData, "Question deleted successfully");
})

exports.getAllQuestions = catchAsyncError(async (req, res, next) => {
    const { quesType } = req.body;

    const quesData = await HrInterviewFilter(quesType);
    send_response(res, 200, true, 0, quesData, "All questions fetched successfully");
})

exports.uploadQuestionsUsingCsv = catchAsyncError(async (req, res, next) => {
    const { file } = req;
    // const questionAddedBy = req.user.role;
    // const userId = req.user.id;

    if (!file) return next(new ErrorHandler("No csv found", 201))
    const fileType = file.mimetype.split('/')[1]

    if (fileType === "csv") {
        const jsonArray = await csv().fromString(req.file.buffer.toString());

        if (jsonArray.length) {
            // checking if all keys are exist in uploaded csv 
            const filterNonEmptyObject = jsonArray.filter((v) => {
                if (Object.keys(v).includes("question_type") && Object.keys(v).includes("difficulty_level") && Object.keys(v).includes("question") && Object.keys(v).includes("option_1") && Object.keys(v).includes("option_2") && Object.keys(v).includes("option_3") && Object.keys(v).includes("option_4") && Object.keys(v).includes("answer")) {
                    return v
                }
            })

            if (filterNonEmptyObject.length) {
                //check if uploaded csv question is duplicate or not
                var newList = [];
                const getQuestionFromDatabase = await mcqquestionModel.find();
                for (let i = 0; i < filterNonEmptyObject.length; i++) {
                    if (getQuestionFromDatabase.length > 0) {
                        var count = 0;
                        for (let j = 0; j < getQuestionFromDatabase.length; j++) {
                            if (filterNonEmptyObject[i].question.trim() == getQuestionFromDatabase[j].question.trim()) {
                                ++count
                            }
                        }
                        if (count == 0) {
                            newList[newList.length] = filterNonEmptyObject[i];
                        }
                    } else {
                        newList = filterNonEmptyObject
                    }
                }

                const checkingisValueMissing = newList.filter((v) => {
                    return v.question_type && v.difficulty_level && v.question && v.option_1 && v.option_2 && v.option_3 && v.option_4 && v.answer
                })

                if (checkingisValueMissing.length) {
                    if (checkingisValueMissing.length === newList.length) {
                        const makingNewArray = newList.map((v) => {
                            return {
                                question_type: v.question_type.toLowerCase().replace(/\n/g, ""),
                                question: v.question.replace(/\n/g, ""),
                                difficulty_level: v.difficulty_level,
                                options: [
                                    v.option_1.replace(/\n/g, ""),
                                    v.option_2.replace(/\n/g, ""),
                                    v.option_3.replace(/\n/g, ""),
                                    v.option_4.replace(/\n/g, "")
                                ],
                                answer: v.answer.replace(/\n/g, ""),
                                // questionAddedBy,
                                // userId
                            }
                        })

                        const questions = await mcqquestionModel.insertMany(makingNewArray);
                        send_response(res, 200, true, 0, questions, "Csv questions uploaded successfully");
                    }
                    else {
                        return next(new ErrorHandler("Some values are missing in the csv file, please check and reupload", 201))
                    }
                } else {
                    return next(new ErrorHandler('This all questions are already uploaded', 201))
                }
            } else {
                return next(new ErrorHandler("The uploaded csv file does not contain following keys Like:question_type,question,option_1,option_2,option_3,option_4,answer", 201))
            }
        } else {
            return next(new ErrorHandler("The uploaded file does not have questions", 201))
        }
    } else {
        return next(new ErrorHandler("The uploaded file was not a matched format, please upload a csv file", 201))
    }
})

// Delete duplicate questions
exports.deleteDuplicateQuestions = catchAsyncError(async (req, res, next) => { 
    const duplicates = await mcqquestionModel.aggregate([
        {
            $group: {
                _id: { question: "$question", answer: "$answer" },
                ids: { $push: "$_id" },
                count: { $sum: 1 }
            }
        },
        { $match: { count: { $gt: 1 } } }
    ]);
    if (duplicates.length) {
        for (const doc of duplicates) {
            const idsToDelete = doc.ids.slice(1);
            await mcqquestionModel.deleteMany({ _id: { $in: idsToDelete } });
        }

        send_response(res, 200, true, 0, duplicates, "The duplicate questions have been deleted successfully");
    } else {
        return next(new ErrorHandler("No duplicate questions found", 200))

    }
})

// Get question types and their difficulty levels
exports.getQuestionTypes = catchAsyncError(async (req, res, next) => {
    const [response] = await mcqquestionModel.aggregate([
        {
            $facet: {
                data: [
                    {
                        $group: {
                            _id: {
                                question_type: "$question_type",
                                difficulty_level: "$difficulty_level"
                            },
                            total: { $sum: 1 }
                        }
                    },
                    {
                        $group: {
                            _id: "$_id.question_type",
                            difficulty_levels: {
                                $push: {
                                    level: "$_id.difficulty_level",
                                    total_questions: "$total"
                                }
                            },
                            total_questions: { $sum: "$total" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            question_types: "$_id",
                            difficulty_levels: 1,
                            total_questions: 1
                        }
                    }
                ],
                meta: [
                    {
                        $count: "total_no_of_questions"
                    }
                ]
            }
        },
        {
            $project: {
                total_no_of_questions: {
                    $arrayElemAt: ["$meta.total_no_of_questions", 0]
                },
                data: "$data"
            }
        }
    ]);

    send_response(res, 200, true, 0, response, "Question types fetched successfully");
})

// Generate random questions for candidates
exports.getRandomQuestion = catchAsyncError(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return next(new ErrorHandler("User id not found", 201));

    const candidate = await interviewCandidateModel.findById(userId, { campaign_id: 1 });
    const campaign_id = candidate?.campaign_id;
    if (!campaign_id) return next(new ErrorHandler("No interview found", 201));

    const campaign = await CampaignModel.findById(campaign_id);
    if (!campaign) return next(new ErrorHandler("Campaign not found", 201));

    const question_pattern = campaign.question_pattern;
    if (!question_pattern.length) return next(new ErrorHandler("Question Pattern not found", 201));

    const test_time_duration = campaign.test_time_duration;
    if (!test_time_duration) return next(new ErrorHandler("Test time duration not given", 201));

    const question_gernerator = await QuestionGeneratorModel.find({ candidate_id: userId });
    if (!question_gernerator) return next(new ErrorHandler("User not found", 201));

    const candidate_apti_id = question_gernerator[0]?._id;
    const if_question_assigned = question_gernerator[0]?.if_question_assigned;
    const questions = await mcqquestionModel.find();

    // Update or send questions
    let generating_questions = [];
    let update_generated_data;
    if (!if_question_assigned) {
        for (const pattern of question_pattern) {
            const { question_type, difficulty_level, questions_count } = pattern;
            // Generating questions
            let initialize_questions = [];
            const techniModreate = questions.filter((v) => v.question_type === question_type && v.difficulty_level === difficulty_level);
            if (techniModreate?.length) {
                while (initialize_questions.length < questions_count && initialize_questions.length < techniModreate.length) {
                    const idx = Math.floor(Math.random() * techniModreate.length);
                    const isQuestionDuplicated = initialize_questions.some((v) => v._id.equals(techniModreate[idx]._id));
                    if (!isQuestionDuplicated) {
                        initialize_questions.push(techniModreate[idx]);
                    }
                }
            }
            generating_questions = [...generating_questions, ...initialize_questions];
        }

        update_generated_data = await QuestionGeneratorModel.findByIdAndUpdate(
            { _id: candidate_apti_id },
            {
                assigned_questions: generating_questions,
                if_question_assigned: true,
                status: "Test Started",
                test_StartedOn: new Date(),
                test_EndedOn: new Date(Date.now() + test_time_duration * 60 * 1000),
            },
            { new: true },
            { score: 0 }
        );

    } else {
        update_generated_data = question_gernerator[0];
    }

    // Remove answers
    update_generated_data.assigned_questions = update_generated_data?.assigned_questions?.map((v) => {
        const { answer, ...rest } = v;
        return rest;
    });

    send_response(res, 200, true, 0, update_generated_data, "Questions fetched successfully");
});

// Validate candidate answers
exports.validationCandidateAnswers = catchAsyncError(async (req, res, next) => {
    const userId = req.user?.id;
    const { close, candidate_answers } = req.body;
    if (!candidate_answers?.length) return next(new ErrorHandler("Candidates answers not found", 201));

    const candidate = await interviewCandidateModel.findById(userId, { campaign_id: 1 });
    const campaign_id = candidate?.campaign_id;
    if (!campaign_id) return next(new ErrorHandler("No interview found", 201));

    const campaign = await CampaignModel.findById(campaign_id);
    if (!campaign) return next(new ErrorHandler("Campaign not found", 201));

    const question_pattern = campaign.question_pattern;
    if (!question_pattern) return next(new ErrorHandler("Question Pattern not found", 201));

    const question_gernerator = await QuestionGeneratorModel.find({ candidate_id: userId });
    if (!question_gernerator) return next(new ErrorHandler("User not found", 201))

    //validating answer
    const candidate_apti_id = question_gernerator[0]?._id;
    const updated_Answers = question_gernerator[0]?.assigned_questions?.map((originalData) => {
        const matchingAnswer = candidate_answers?.find((responseData) => {
            const objectId = new ObjectId(responseData?._id);
            return originalData?._id?.equals(objectId);
        });
        return {
            ...originalData,
            candidate_answer: matchingAnswer?.candidate_answer || '',
        };
    });

    const scoreBreakdown = {};
    for (const pattern of question_pattern) {
        const { question_type, difficulty_level } = pattern;
        const matchedAnswers = updated_Answers?.filter(val =>
            val?.question_type === question_type &&
            val?.difficulty_level === difficulty_level &&
            val?.candidate_answer === val?.answer
        );

        const total_question = updated_Answers?.filter(val =>
            val?.question_type === question_type &&
            val?.difficulty_level === difficulty_level
        );
        const key = `${question_type}_${difficulty_level}`;
        scoreBreakdown[key] = `${matchedAnswers?.length || 0} out of ${total_question?.length || 0}`;
    }

    await QuestionGeneratorModel.findByIdAndUpdate(
        { _id: candidate_apti_id },
        {
            assigned_questions: updated_Answers,
            status: close === "malpractice" ? close : "Test Completed",
            score: scoreBreakdown
        }
    );
    //

    //Test completed user one time logged in setting true
    const candidate_id = question_gernerator[0]?.candidate_id;
    const candidate_exist = await interviewCandidateModel.findById({ _id: candidate_id });
    if (!candidate_exist) return next(new ErrorHandler("User not found", 201))

    // If oneTimeLoggedin is true then the test has been completed 
    if (candidate_exist?.oneTimeLoggedin) return next(new ErrorHandler("Response already submitted", 201))

    await interviewCandidateModel.findByIdAndUpdate({ _id: candidate_id }, { oneTimeLoggedin: true });
    send_response(res, 200, true, 0, {}, "Candidate answers validated successfully");
})

exports.getInterviewCandidateStatus = catchAsyncError(async (req, res, next) => {
    const getCandidates = await QuestionGeneratorModel.aggregate([
        {
            $lookup: {
                from: "interview_candidates",
                localField: "candidate_id",
                foreignField: "_id",
                as: "candidate_details"
            }
        },
        {
            $project: {
                aptitude_score: 1,
                reasoning_score: 1,
                tech_hard_score: 1,
                tech_moderate_score: 1,
                test_EndedOn: 1,
                test_StartedOn: 1,
                candidate_role: 1,
                status: 1,
                candidate_details: {
                    name: 1,
                    candidateQualification: 1,
                    phoneNumber: 1,
                    email: 1,
                    address: 1
                }
            }
        }
    ])

    send_response(res, 200, true, 0, getCandidates, "Candidate status fetched successfully");
})

exports.generateSampleTest = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return next(new ErrorHandler("Invalid campaign ID", 201));

    const campaign = await CampaignModel.findById(id);
    if (!campaign) return next(new ErrorHandler("Campaign not found", 201));

    const question_pattern = campaign.question_pattern;
    if (!question_pattern) return next(new ErrorHandler("Question Pattern not found", 201));
    const questions = await mcqquestionModel.find();

    // Update or send questions
    let generating_questions = [];
    let update_generated_data;
    for (const pattern of question_pattern) {
        const { question_type, difficulty_level, questions_count } = pattern;
        // Generating questions
        let initialize_questions = [];
        const techniModreate = questions.filter((v) => v.question_type === question_type && v.difficulty_level === difficulty_level);
        if (techniModreate?.length) {
            while (initialize_questions.length < questions_count && initialize_questions.length < techniModreate.length) {
                const idx = Math.floor(Math.random() * techniModreate.length);
                const isQuestionDuplicated = initialize_questions.some((v) => v._id.equals(techniModreate[idx]._id));
                if (!isQuestionDuplicated) {
                    initialize_questions.push(techniModreate[idx]);
                }
            }
        }
        generating_questions = [...generating_questions, ...initialize_questions];
    }

    update_generated_data = {
        job_title: campaign.job_title,
        generated_questions: generating_questions
    }
    if (!generating_questions?.length) return next(new ErrorHandler("Questions not found", 201));
    send_response(res, 200, true, 0, update_generated_data, "Questions generated");
})

//Update malpractice involving
exports.updateInvolvingInMalpractice = catchAsyncError(async (req, res, next) => {
    const userId = req.user?.id;
    const { remaining_switching_count } = req.body;
    if (!userId) return next(new ErrorHandler("User id not found", 201));

    const candidate = await interviewCandidateModel.findById(userId);
    if (!candidate) return next(new ErrorHandler("Candidate not found", 201));

    const updatedCandidate = await interviewCandidateModel.findByIdAndUpdate(userId, { involved_in_tab_switching: remaining_switching_count - 1 }, { new: true });
    send_response(res, 200, true, 0, { candidate_id: userId, involved_in_tab_switching: updatedCandidate.involved_in_tab_switching }, "Involvement in tab switching updated");
})