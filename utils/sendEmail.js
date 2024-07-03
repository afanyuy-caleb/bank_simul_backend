require('dotenv').config()
const nodemailer = require('nodemailer')

module.exports = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    service: 'gmail',
    auth: {
        user: process.env.USER_NAME,
        pass: process.env.PASSWORD
    }
})