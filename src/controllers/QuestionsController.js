const { HrInterviewFilter } = require('../functionPieces/HrInterviewFilter');
const catchAsyncError = require('../middlewares/catchAsyncError');
const mcqquestionModel = require('../models/McqQuestionsModel');
const QuestionGeneratorModel = require('../models/QuestionGeneratorModel')
const ErrorHandler = require('../utils/errorHandling');
const csv = require('csvtojson');

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
            return next(new ErrorHandler("User not found", 404))
        }
        const candidate_apti_id = question_gernerator[0]?._id
        const candidateRole = question_gernerator[0]?.candidate_role
        const difficultyLevel = question_gernerator[0]?.difficulty_level
        const if_question_assigned = question_gernerator[0]?.if_question_assigned


        const questions = await mcqquestionModel.find()
        var generated_questions = [];
        let update_generated_questions = [];

        const aptitude = questions.filter((v) => v.question_type === "aptitude")
        if (aptitude?.length) {
            for (var i = 0; i < 30; i++) {
                var idx = Math.floor(Math.random() * aptitude.length);
                generated_questions.push(aptitude[idx]);
            }
        }

        const technicalQues = questions.filter((v) => v.question_type === "mern")
        if (technicalQues?.length) {
            for (var i = 0; i < 30; i++) {
                var idx = Math.floor(Math.random() * technicalQues.length);
                generated_questions.push(technicalQues[idx]);
            }
        }

        // if (!if_question_assigned) {
            update_generated_questions = await QuestionGeneratorModel.findByIdAndUpdate(
                { _id: candidate_apti_id },
                {
                    assigned_questions: generated_questions,
                    if_question_assigned: generated_questions?.length ? true : false,
                    status: "Test Started",
                    test_StartedOn: new Date(),
                    test_EndedOn: new Date(Date.now() + (60 + 5) * 60 * 1000)
                },
                {
                    new: true,
                });

            console.log(update_generated_questions)
        // } else {
        //     update_generated_questions = question_gernerator
        // }

        res.status(200).json({
            success: true,
            error_code: 0,
            data: update_generated_questions,
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