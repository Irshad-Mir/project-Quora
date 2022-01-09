const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const userModel = require('../models/userModel')
const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/
const emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true;
}

const isValidPassword = function(password) {
    if (password.length > 7 && password.length < 16)
        return true
}
const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

//Feature 1- API 1 Register User
const registerUser = async function(req, res) {

    try {
        const requestBody = req.body

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, Message: "Invalid request params, please provide user details in body" })
        }
        // extract prams
        let { fname, lname, email, phone, password, creditScore } = requestBody

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, Message: "Please provide first name" })
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, Message: "Please provide last name" })
        }
       let Email = email.split(" ").join("");
        if (!isValid(email)) {
            return res.status(400).send({ status: false, Message: "Please provide email" })
        }
        
        if (!((emailRegex).test(Email))) {
            return res.status(400).send({ status: false, Message: "Please provide valid email" })
        }
        
        const isEmailAlready = await userModel.findOne({ email: Email });
        if (isEmailAlready) {
          return res.status(400).send({ status: false, Message: `${Email} is already used` });
        }

        if (phone) {
            if (!((phoneRegex).test(phone.split(" ").join("")))) {
                return res.status(400).send({ status: false, Message: "Please provide valid phone number" })
            }
            const isPhoneAlreadyUsed = await userModel.findOne({ phone });
            if (isPhoneAlreadyUsed) {
                res.status(400).send({ status: false, message: `${phone}  phone is already registered` })
                return
            }
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, Message: "Please provide password" })
        }

        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, Message: "Length of password should be 8-15 char." })
        }

        if (!isValid(creditScore)) {
            return res.status(400).send({ status: false, message: "Please provide CreditScore" });;
        }
        /*
        if (isNaN(creditScore)) {
            return res.status(400).send({ status: false, message: "You can't use special characters or alphabets in CreditScore" });
        }
        if (creditScore < 0) {
            return res.status(400).send({ status: false, message: "You can't give negative values in CreditScore" });
        }
        */
      if(!(creditScore=='500')){
            res.status(400).send({ status: false, message: `creditScore should be  500` })
            return
        };

        const encryptedPass = await bcrypt.hash(password, 10)
        const userData = { fname, lname, email: Email, phone, password: encryptedPass, creditScore }
        const createUser = await userModel.create(userData)
        return res.status(201).send({ status: true, Message: "User registered successfully", data: createUser })
    } catch (error) {
        return res.status(500).send({ status: false, Message: error.message })
    }
}

//Feature 1- API 2- lOGIN USER
const loginUser = async function(req, res) {
    try {
        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, Message: "Please provide login credentials" })
        }

        // // Extract params
        let { email, password } = requestBody;
        email=email.trim()
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }

        if (!((emailRegex).test(email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
       password=password.trim()
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(404).send({ status: false, Message: `No user found with ${email}` })
        }

        const matchPassword = await bcrypt.compareSync(password, user.password) //matching original and encrypted

        if (!matchPassword) {
            return res.status(401).send({ status: false, message: 'Password Incorrect' })
        }

        const token = await jwt.sign({
            userId: user._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
        }, 'sms')

        res.status(200).send({ status: true, message: `user login successfull`, data: { token, userId: user._id } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

//fEATURE 3- API 3 - Get user details

const getUser = async function(req, res) {
    try {
        const userId = req.params.userId
        const tokenId = req.userId

        if (!isValidObjectId(userId)) {
            res.status(400).send({ status: false, Message: "Please provide valid user id" })
        }
        if (userId == tokenId) {
            const user = await userModel.findOne({ _id: userId })
            return res.status(200).send({ status: true, Message: "Details fetch successfully", data: user })
        } else {
            return res.status(401).send({ status: false, Message: "You are not authorized to fetch details of this user!!!" })
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

// Feature 1 - API 4 - Update User Profile

const updateUser = async function(req, res) {

    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        const decodedId = req.userId;

        if (userId == decodedId) {
            if (!isValidRequestBody(requestBody)) {
                return res.status(200).send({ Message: "No data updated, details are unchanged" })
            }
            //Extract Params
            let { fname, lname, email, phone } = requestBody

            const userFind = await userModel.findById(userId)

            if (fname) {
                if (!isValid(fname)) {
                    res.status(400).send({ status: false, Message: "Provide a valid fname" })
                }
                userFind['fname'] = fname
            }

            if (lname) {
                if (!isValid(lname)) {
                    res.status(400).send({ status: false, Message: "Provide a valid fname" })
                }
                userFind['lname'] = lname
            }

            if (email) {
                if (!(emailRegex).test(email)) {
                    return res.status(400).send({ status: false, message: " Provide a valid email address" })
                }
                const isEmailAlreadyUsed = await userModel.findOne({ email: email });
                if (isEmailAlreadyUsed) {
                    return res.status(400).send({ status: false, message: `${email} email address is already registered` })
                }
                userFind['email'] = email
            }

            if (phone) {
                if (!(phoneRegex).test(phone)) {
                    return res.status(400).send({ status: false, message: " Provide a valid phone number" })
                }
                const isPhoneAlreadyUsed = await userModel.findOne({ phone: phone });
                if (isPhoneAlreadyUsed) {
                    return res.status(400).send({ status: false, message: `${phone} is already registered` })
                }
                userFind['phone'] = phone
            }
            const updatedData = await userFind.save()
            return res.status(200).send({ status: true, Message: "Data Updated Successfully", data: updatedData })
        } else {
            res.status(401).send({ status: false, Message: "You are not authorzied to update this user profile" })
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { registerUser, loginUser, getUser, updateUser }