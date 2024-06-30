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
        maxlength: 15
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
    password_hash: String,
    identityPic: {
        type: String,
        required: true,
    },
    profilePic: String,
    acc_nb: Number,
    reg_status: {
        type: Boolean,
        default: false,
    }
})

const userModel = mongoose.model('User', userSchema)
module.exports = userModel