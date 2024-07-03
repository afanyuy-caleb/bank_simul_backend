const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const userModel = require('../models/User')
const imgFields = require('./File')
const baseController = require('./BaseController')
const validator = require('validator')

const validateData = (postData)=>{
    try{
        // Check for empty entries
        for(let key in postData){
            if(validator.isEmpty(postData[key].toString())){
                return {status: false, msg: key + " musn't be empty", field: key};
            }
        }
        // Check for invalid email
        if(!validator.isEmail(postData['email'])){
            return {status: false, msg: "invalid email address", field: 'email'}
        }
    
        // Check for pass and passcnf
        if(postData['pass'].length < 5){
            return {status: false, msg: "password is too short", field: 'pass'}
        }

        if(postData['pass'] !== postData['passcnf']){
            return {status: false, msg: "passwords do not match", field: 'passcnf'}
        }
        return {status: true};
    }catch(err){
        console.log(err)
        return {status: false, msg: err.message, field: 'form'}
    }
}

const activateUser = (req, res, next) =>{
    imgFields(req, res, (err)=>{
        // Custom middleware error handler
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ msg: err.message.toLowerCase()+ ', max file size is 4Mb', field: err.field });
            }

            return res.status(400).json({ error: err.message.toLowerCase() });
        }

        var validData = validateData(req.body)

        if(!validData.status){
            code = 400
            obj = validData
        }
        else{
            if(!req.files && !req.file){
                code = 400
                obj = {status: false, msg: "No files included", field: 'form'}
            }
            if (err) {
                code = 400
                const {msg, picField} = JSON.parse(err.message)
                obj =  {status: false, msg, field: picField}
            } 
            else{
                // Handle user activation, by sending the email
                obj = {status: true, msg: 'success', field: "form"}
            }
        }

        return baseController.serverResponse(code, obj, res)
    })
}

const addUser = (req, res) =>{
    console.log(req.body)
}

const getUsers = (req, res) =>{
    res.status(200).json({message: "This is really cool"})
}

module.exports = {
    addUser,
    getUsers,
    activateUser,
};          