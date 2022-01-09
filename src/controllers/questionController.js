const mongoose = require('mongoose')
const questionModel = require('../models/questionModel.js')
const answerModel = require('../models/answerModel.js')
const userModel = require('../models/userModel.js')

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true;
}

const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

//Feature 2 - API 1 - Create Question
const createQuestion = async function(req, res) {

    try {
        const requestBody = req.body
        const userId = req.body.askedBy
        const decodedId = req.userId


        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, Message: "Invalid request params, please provide question details" })
        }

        if (!isValid(userId)) {
            return res.status(400).send({ status: false, Message: "Please provide askedBy ID" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, Message: "Please provide vaild askedBy ID" })
        }
        if (decodedId == userId) {
            let { description, tag } = requestBody

            if (!isValid(description)) {
                return res.status(400).send({ status: false, Message: "Please provide description" })
            }

            requestBody.tag = tag.split(',').map((x) => x.trim())

            const user = await userModel.findById(userId)

            if (user.creditScore < 100) {
                return res.status(400).send({ status: false, Message: "You don't have enough credit score to post a question" })
            }

            let question = await questionModel.create(requestBody)

            await userModel.findOneAndUpdate({ _id: userId }, { $inc: { creditScore: -100 } })
            return res.status(201).send({ status: false, Message: "Question created successfully", data: question })
        } else {
            return res.status(401).send({ status: false, Message: "Unauthorized access attemped! can't post question using this ID" })
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//Feature 2 - API 2 - Get Questions By ID

const getAllQuestion = async function(req, res) {
    try {

        let filter = { isDeleted: false }
        let querybody = req.query;

        //extract Params
        const { sort, tag } = querybody


        if (isValid(tag)) {
            const tagsArr = tag.trim().split(',').map(tag => tag.trim());
            filter['tag'] = { $all: tagsArr }
        }


        if (isValid(sort)) {
            if (sort == "ascending") {
                var data = await questionModel.find(filter).lean().sort({ createdAt: 1 })
            }
            if (sort == "descending") {
                var data = await questionModel.find(filter).lean().sort({ createdAt: -1 });
            }
        }

        if (!sort) {
            var data = await questionModel.find(filter).lean();
        }

        for (let i = 0; i < data.length; i++) {
            let answer = await answerModel.find({ questionId: data[i]._id })
            data[i].answers = answer
        }

        return res.status(200).send({ status: true, Message: "Question List", data: data })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//Feature 2 - API 3 - Get Question By Id

const getQuestionById = async function(req, res) {
    try {


        const qId = req.params.questionId
        if (!isValidObjectId(qId)) {
            return res.status(400).send({ status: false, Message: "Please provide vaild question ID" })
        }

        const question = await questionModel.findOne({ _id: qId, isDeleted: false })

        if (!question) {
            res.status(404).send({ status: false, Message: "No question found with provided ID" })
        }
        const answer = await answerModel.find({ questionId: qId, isDeleted: false })

        if (answer.length === 0) {
            var ansArr = {
                description: question.description,
                tag: question.tag,
                askedBy: question.askedBy,
                answers: "No answers yet"
            }
            return res.status(200).send({ status: true, data: ansArr })
        }

        var ansArr = {
            description: question.description,
            tag: question.tag,
            askedBy: question.askedBy,
            answers: answer
        }
        return res.status(200).send({ status: true, data: ansArr })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//Feature 2 - API 4 - update question

const updateQues = async function(req, res) {
    try {
        const qId = req.params.questionId
        const requestBody = req.body;
        const tokenId = req.userId
            // console.log(tokenId)
            // console.log(aId)
        if (!isValidObjectId(qId)) {
            return res.status(400).send({ status: false, Message: "Please provide valid question id" })
        }
        if (!isValidRequestBody(requestBody)) {
            return res.status(200).send({ Message: "No data updated,details are unchanged" })
        }
        const question = await questionModel.findOne({ _id: qId, isDeleted: false })
        if (!(question)) {
            return res.status(404).send({ status: false, msg: "No question found with this Id" })
        }
        //  console.log(question.askedBy.toString())
        if (!(tokenId == question.askedBy.toString())) {
            return res.status(401).send({ status: false, msg: "You are  not authorized to update this question" })
        }
        let { description, tag } = requestBody
        // console.log(questionFind)
        if (description) {
            question['description'] = description
        }
        if (tag) {
            tag = tag.split(',').map((x) => x.trim())
            if (Array.isArray(tag)) {
                question['tag'] = [...tag]
            }
            if (Object.prototype.toString.call(tag) === "[object String]") {
                question['tag'] = [tag]
            }
        }
        const updatedData = await question.save()
        return res.status(200).send({ status: true, Message: "Data saved Sucessfully", data: updatedData })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//Feature 2 - API 5 - Delete Question

const deleteQues = async function(req, res) {
    try {
        const qId = req.params.questionId
        const tokenId = req.userId
        if (!isValidObjectId(qId)) {
            return res.status(400).send({ status: false, Message: "Please provide valid question id" })
        }
        const question = await questionModel.findOne({ _id: qId, isDeleted: false })
        if (!(question)) {
            return res.status(404).send({ status: false, msg: "No question found with this Id" })
        }
        // console.log(question.askedBy.toString())
        if (!(tokenId == question.askedBy.toString())) {
            return res.status(401).send({ status: false, msg: "You are  not authorized to update this question" })
        }
        const deletedData = await questionModel.findOneAndUpdate({ _id: qId }, { isDeleted: true, deletedAt: new Date() }, { new: true })
        return res.status(200).send({ status: true, msg: "Question Deleted", data: deletedData })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = { createQuestion, getAllQuestion, getQuestionById, updateQues, deleteQues }