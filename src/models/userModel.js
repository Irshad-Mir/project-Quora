const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({


    fname: {
        type: String,
        required: "First name is required",
        trim: true
    },
    lname: {
        type: String,
        required: "Last name is required",
        trim: true
    },
    email: {
        type: String,
        required: "Email is required",
        trim: true,
        unique: true,
    },
    phone: {
        type: String,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: "Password is required",
        min: 8,
        max: 15
    }, // encrypted password

    creditScore: {
        type: Number,
        required: true,
        trim:true
    }

}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)