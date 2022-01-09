const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({

    description: {
        type: String,
        required: true
    },
    tag: {
        type: [String]
    },
    askedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },

}, { timestamps: true })

module.exports = mongoose.model('Question', questionSchema)