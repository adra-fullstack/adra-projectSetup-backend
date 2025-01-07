const { HrInterviewFilter } = require('../functionPieces/HrInterviewFilter');
const catchAsyncError = require('../middlewares/catchAsyncError');
const interviewCandidateModel = require('../models/interviewCandidateModel');
const mcqquestionModel = require('../models/McqQuestionsModel');
const QuestionGeneratorModel = require('../models/QuestionGeneratorModel');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandling');
const csv = require('csvtojson');
const { ObjectId } = require('mongodb');

exports.createQuestions = catchAsyncError(async (req, res, next) => {
    const { flag, data } = req.body;
    const questionAddedBy = req.user.role;
    const userId = req.user.id;

    if (flag === "mcq") {
        const add_UserId_And_AddedBy = data.map((v) => {
            return { ...v, questionAddedBy, userId }
        })

        const questions = await mcqquestionModel.insertMany(add_UserId_And_AddedBy);

        res.status(200).json({
            success: true,
            questions,
            message: "Question insterted successfully"
        })
        return
    } else {
        return next(new ErrorHandler("flag required Ex:aptitude,reasoning,technical question", 404))
    }
});

exports.updateQuestions = catchAsyncError(async (req, res, next) => {
    const validatingQuestion_byId = await mcqquestionModel.findById(req.body._id)
    if (!validatingQuestion_byId) {
        return next(new ErrorHandler("Question not found", 404))
    }

    const updateQuestion = await mcqquestionModel.findByIdAndUpdate(req.body._id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        updateQuestion,
        message: "Question updates successfully"
    })
})

exports.deleteQuestions = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { question_type } = req.body;
    if (!id) {
        return next(new ErrorHandler("question_id required", 404))
    }

    if (!question_type) {
        return next(new ErrorHandler("question_type required", 404))
    }

    const deleteQuestion = await mcqquestionModel.findById(id)

    if (!deleteQuestion) {
        return next(new ErrorHandler("Questions not found", 400))
    }

    await mcqquestionModel.findByIdAndDelete(id);
    const quesData = await HrInterviewFilter(question_type);
    res.status(200).json({
        success: true,
        data: quesData,
        message: "Question deleted successfully"
    })
})

exports.getAllQuestions = catchAsyncError(async (req, res, next) => {
    const { quesType } = req.body;

    const quesData = await HrInterviewFilter(quesType);
    res.status(200).json({
        success: true,
        data: quesData,
        message: "All questions fetched successfully"
    })
})

exports.getQuestionTypes = catchAsyncError(async (req, res, next) => {
    const questions = await mcqquestionModel.find({}, { question_type: 1, _id: 0 })

    let question_types = [];
    questions.forEach((ques) => {
        if (!question_types.includes(ques.question_type)) {
            question_types[question_types.length] = ques.question_type
        }
    })

    res.status(200).json({
        success: true,
        question_types,
        random_array,
        message: "question types fetched successfully"
    })
})

exports.uploadQuestionsUsingCsv = catchAsyncError(async (req, res, next) => {
    const { file } = req;
    // const questionAddedBy = req.user.role;
    // const userId = req.user.id;

    if (!file) {
        return next(new ErrorHandler("No csv found", 404))
    }

    const fileType = file.mimetype.split('/')[1]

    if (fileType === "csv") {
        const jsonArray = await csv().fromString(req.file.buffer.toString());

        if (jsonArray.length) {
            // checking if all keys are exist in uploaded csv 
            const filterNonEmptyObject = jsonArray.filter((v) => {
                console.log(Object.keys(v).includes("question_type"), Object.keys(v).includes("difficulty_level"), Object.keys(v).includes("question"), Object.keys(v).includes("option_1"), Object.keys(v).includes("option_2"), Object.keys(v).includes("option_3"), Object.keys(v).includes("option_4"), Object.keys(v).includes("answer"))
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

                        res.status(200).json({
                            success: true,
                            data: questions,
                            message: 'Csv questions uploaded successfully'
                        })
                    }
                    else {
                        res.status(400).json({
                            success: false,
                            message: 'values are missing in somewhere check and reupload'
                        })
                    }
                } else {
                    res.status(200).json({
                        success: false,
                        message: 'This all questions are already uploaded'
                    })
                }
            } else {
                res.status(400).json({
                    success: false,
                    message: 'The uploaded csv file does not contain following keys Like:question_type,question,option_1,option_2,option_3,option_4,answer'
                })
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'The uploaded file does not have questions'
            })
        }
    } else {
        res.status(400).json({
            success: false,
            message: 'The uploaded file was not a matched format'
        })
    }
})

exports.getRandomQuestion = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const question_gernerator = await QuestionGeneratorModel.find({ candidate_id: userId });

        if (!question_gernerator) {
            return next(new ErrorHandler("User not found", 404));
        }

        const candidate_apti_id = question_gernerator[0]?._id;
        const if_question_assigned = question_gernerator[0]?.if_question_assigned;

        const questions = await mcqquestionModel.find();
        let tech_questions_moderate = [];
        let tech_questions_hard = [];
        let apti_questions = [];

        // Generate technical moderate questions
        const techniModreate = questions.filter((v) => v.question_type === "mern" && v.difficulty_level === "moderate");
        if (techniModreate?.length) {
            while (tech_questions_moderate.length < 15 && tech_questions_moderate.length < techniModreate.length) {
                const idx = Math.floor(Math.random() * techniModreate.length);
                const isQuestionDuplicated = tech_questions_moderate.some((v) => v._id.equals(techniModreate[idx]._id));
                if (!isQuestionDuplicated) {
                    tech_questions_moderate.push(techniModreate[idx]);
                }
            }
        }
        console.log(tech_questions_moderate?.length, "mern moderate", techniModreate?.length)

        // Generate technical hard questions
        const techniHard = questions.filter((v) => v.question_type === "mern" && v.difficulty_level === "hard");
        if (techniHard?.length) {
            while (tech_questions_hard.length < 25 && tech_questions_hard.length < techniHard.length) {
                const idx = Math.floor(Math.random() * techniHard.length);
                const isQuestionDuplicated = tech_questions_hard.some((v) => v._id.equals(techniHard[idx]._id));
                if (!isQuestionDuplicated) {
                    tech_questions_hard.push(techniHard[idx]);
                }
            }
        }
        console.log(tech_questions_hard?.length, "mern HARD", techniHard?.length)

        // Generate aptitude questions
        const aptiQues = questions.filter((v) => v.question_type === "aptitude");
        if (aptiQues?.length) {
            while (apti_questions.length < 20 && apti_questions.length < aptiQues.length) {
                const idx = Math.floor(Math.random() * aptiQues.length);
                const isQuestionDuplicated = apti_questions.some((v) => v._id.equals(aptiQues[idx]._id));
                if (!isQuestionDuplicated) {
                    apti_questions.push(aptiQues[idx]);
                }
            }
        }
        console.log(apti_questions?.length, "aptiQues", aptiQues?.length)


        // Combine questions and ensure 60 total
        var generated_questions = [...apti_questions, ...tech_questions_moderate, ...tech_questions_hard];
        while (generated_questions.length < 60 && questions.length > generated_questions.length) {
            const idx = Math.floor(Math.random() * questions.length);
            const isDuplicated = generated_questions.some((q) => q._id.equals(questions[idx]._id));
            if (!isDuplicated) {
                generated_questions.push(questions[idx]);
            }
        }

        // Update or send questions
        let update_generated_data;
        if (!if_question_assigned) {
            update_generated_data = await QuestionGeneratorModel.findByIdAndUpdate(
                { _id: candidate_apti_id },
                {
                    assigned_questions: generated_questions,
                    if_question_assigned: true,
                    status: "Test Started",
                    test_StartedOn: new Date(),
                    test_EndedOn: new Date(Date.now() + 60 * 60 * 1000),
                },
                { new: true }
            );
        } else {
            update_generated_data = question_gernerator[0];
        }

        // Remove answers
        update_generated_data.assigned_questions = update_generated_data?.assigned_questions?.map((v) => {
            const { answer, ...rest } = v;
            return rest;
        });

        res.status(200).json({
            success: true,
            error_code: 0,
            data: update_generated_data,
            message: "Questions fetched successfully",
        });
    } catch (Err) {
        res.status(500).json({
            success: false,
            message: Err?.message,
        });
    }
});

exports.validationCandidateAnswers = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const candidateAnswers = req.body;
        const question_gernerator = await QuestionGeneratorModel.find({ candidate_id: userId });
        if (!question_gernerator) {
            return next(new ErrorHandler("User not found", 404))
        }

        //validating answer
        const candidate_apti_id = question_gernerator[0]?._id;
        const updated_Answers = question_gernerator[0]?.assigned_questions?.map((originalData) => {
            const matchingAnswer = candidateAnswers?.find((responseData) => {
                const objectId = new ObjectId(responseData?._id);
                return originalData?._id?.equals(objectId);
            });
            return {
                ...originalData,
                candidate_answer: matchingAnswer?.candidate_answer || '',
            };
        });

        const calculate_apti_score = updated_Answers?.filter((val) => val?.question_type === "aptitude" && val?.candidate_answer === val?.answer)
        const calculate_tech_moderate_score = updated_Answers?.filter((val) => val?.question_type === "mern" && val?.difficulty_level === "moderate" && val?.candidate_answer === val?.answer)
        const calculate_tech_hard_score = updated_Answers?.filter((val) => val?.question_type === "mern" && val?.difficulty_level === "hard" && val?.candidate_answer === val?.answer)

        await QuestionGeneratorModel.findByIdAndUpdate(
            { _id: candidate_apti_id },
            {
                assigned_questions: updated_Answers,
                status: "Test Completed",
                aptitude_score: calculate_apti_score?.length || 0,
                tech_moderate_score: calculate_tech_moderate_score?.length || 0,
                tech_hard_score: calculate_tech_hard_score?.length || 0
            }
        );
        //

        //Test completed user one time logged in setting true
        const candidate_id = question_gernerator[0]?.candidate_id;
        const candidate_exist = await interviewCandidateModel.findById({ _id: candidate_id });
        if (!candidate_exist) {
            return next(new ErrorHandler("User not found", 404))
        }

        // If oneTimeLoggedin is true then the test has been completed 
        if (candidate_exist?.oneTimeLoggedin) {
            return next(new ErrorHandler("Response already submitted", 404))
        }

        await interviewCandidateModel.findByIdAndUpdate({ _id: candidate_id }, { oneTimeLoggedin: true });
        res.status(200).json({
            success: true,
            error_code: 0,
            data: {},
            message: "Questions fetched successfully"
        })
    }
    catch (Err) {
        res.status(500).json({
            success: false,
            message: Err?.message
        })
    }
})

exports.getInterviewCandidateStatus = catchAsyncError(async (req, res, next) => {
    try {
        // const userId = req.user?.id;
        // const user = await User.findById({ _id: userId });
        // if (!user) {
        //     return next(new ErrorHandler("User not found", 404))
        // }

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


        res.status(200).json({
            success: true,
            data: getCandidates,
            error_code: 0,
            message: "candidate status fetched"
        })

    }
    catch (Err) {
        res.status(500).json({
            success: false,
            message: Err?.message
        })
    }
})