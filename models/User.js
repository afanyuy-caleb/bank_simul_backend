const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50
    },
    tel: {
        type: String,
        unique: true,
        required: true,
        maxlength: 20
    },
    DOB: {
        type: Date,
        required: true,
        default: Date.now
    },
    address: {
        type: String,
        required: true,
        maxlength: 50
    },
    pass: String,
    identity: {
        type: String,
        required: true,
    },
    profilePic: String,
    acc_nb: {
        type: String,
        required: true
    },
    reg_status: {
        type: Boolean,
        default: false,
    }
}, {timestamps: true})

module.exports = mongoose.model('User', userSchema)
