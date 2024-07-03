const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const userModel = require('../models/User')
const {imgFields, uploadFields} = require('./File')
const baseController = require('./BaseController')
const validator = require('validator')
const accActivation = require('./AccountActivation')


class userController{

    validateData = (postData)=>{
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
    
    middleWareHandler = (err, res, req) =>{
        // Custom middleware error handler
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ msg: err.message.toLowerCase()+ ', max file size is 4Mb', field: err.field });
            }
    
            return res.status(400).json({ error: err.message.toLowerCase() });
        }

        var validData = this.validateData(req.body)
        var code = 0;
        var obj = {};
    
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
                code = 200;
                obj = {status: true, msg: 'success', field: "form"}
            }
        }

        return {code, obj}
    }
    
    activateUser = (req, res, next) =>{
        imgFields(req, res, (err)=>{
            const {code, obj} = this.middleWareHandler(err, res, req)
            if(obj.status){
                // Handle user activation in baseController
            }

            return baseController.serverResponse(code, obj, res)
        })
    }
    
    addUser = (req, res) =>{
        uploadFields(req, res, (err)=>{
            const {code, obj} = this.middleWareHandler(err, res, req)
            if(obj.status){
                // Create a user
                console.log(req.files)
                // console.log(req.body)
            }

            return baseController.serverResponse(code, obj, res)
        })
    }
    
    getUsers = (req, res) =>{
        res.status(200).json({message: "This is really cool"})
    }
}



module.exports = new userController