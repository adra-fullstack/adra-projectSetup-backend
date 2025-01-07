const mcqquestionModel = require('../models/McqQuestionsModel');

exports.HrInterviewFilter = async(question_type) => {
    let allQuestions = await mcqquestionModel.find();
    let currentQuestionType;
    let allQuestionTypes = [];
    let allQuestionTypesAob = [];
    allQuestions.forEach((ques) => {
        if (!allQuestionTypes.includes(ques.question_type)) {
            allQuestionTypes[allQuestionTypes.length] = ques.question_type

            allQuestionTypesAob[allQuestionTypesAob.length] = {
                question_type: ques.question_type,
                count: 1
            }
        }
        else {
            const gettingIndex = allQuestionTypesAob.findIndex((v) => {
                return v.question_type === ques.question_type
            })
            allQuestionTypesAob[gettingIndex] = {
                question_type: allQuestionTypesAob[gettingIndex].question_type,
                count: allQuestionTypesAob[gettingIndex].count + 1
            }
        }
    })
    if (question_type) {
        const isQuestionsAvailable = allQuestions.filter((v) => {
            return v.question_type === question_type
        })
        if (isQuestionsAvailable.length) {
            allQuestions = isQuestionsAvailable
            currentQuestionType = question_type
        } else {
            currentQuestionType = allQuestionTypes[0]
        }
    } else {
        if (allQuestionTypes.length) {
            allQuestions = allQuestions.filter((v) => {
                return v.question_type === allQuestionTypes[0]
            })

            currentQuestionType = allQuestionTypes[0]
        }
    }

    return {
        questions: allQuestions,
        questionsCount: allQuestions.length,
        currentQuestionType: currentQuestionType ? currentQuestionType : '',
        questionsTypes: allQuestionTypesAob
    }
}