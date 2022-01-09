const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController.js')
const questionController = require('../controllers/questionController.js')
const answerController = require('../controllers/answerController.js')
const auth = require('../middleware/midware')
module.exports = router


//User Routes
router.post('/register', userController.registerUser)
router.post('/login', userController.loginUser)
router.get('/user/:userId/profile', auth.userAuth, userController.getUser)
router.put('/user/:userId/profile', auth.userAuth, userController.updateUser)

//Question Routes
router.post('/question', auth.userAuth, questionController.createQuestion)
router.get('/questions', questionController.getAllQuestion)
router.get('/questions/:questionId', questionController.getQuestionById)
router.put('/questions/:questionId', auth.userAuth, questionController.updateQues)
router.delete('/questions/:questionId', auth.userAuth, questionController.deleteQues)

//answer routes
router.post('/answer', auth.userAuth, answerController.createAnswer)
router.get('/questions/:questionId/answer', answerController.getAns)
router.put('/answer/:answerId', auth.userAuth, answerController.updateAns)
router.delete('/answer/:answerId', auth.userAuth, answerController.delAns)