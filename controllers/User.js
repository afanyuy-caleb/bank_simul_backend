const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const userModel = require('../models/User')
const {imgFields, uploadFields} = require('./File')
const baseController = require('./BaseController')
const validator = require('validator')
const accActivation = require('./AccountActivation')
const {format} = require('date-fns')


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
        imgFields(req, res, async (err)=>{
            var {code, obj} = this.middleWareHandler(err, res, req)
            if(obj.status){
                const {status, msg} = await baseController.mailHandler(req.body.email)

                code = 400
                if(status){
                    // save to the db

                    var saving = await accActivation.addRecord({
                        email : req.body.email,
                        activationToken: msg,
                        expiresAt: new Date(Date.now() + 60*60*1000)
                    })
                    code = 200
                    obj = {status: saving.status, msg: saving.msg, field: "form"}
                }else{
                    console.log(msg)
                    obj = {status, msg, field: "form"}
                }
            }

            return baseController.serverResponse(code, obj, res)
        })
    }
    
    addUser = (req, res) =>{
        uploadFields(req, res, async (err)=>{
            var {code, obj} = this.middleWareHandler(err, res, req)
            if(obj.status){
                // Check if the user exists
                var {status, data} = await this.readOne({email: req.body.email})
                if(status){
                    if(data !== null){
                        // Record exists
                        code = 400
                        obj = {status: false, msg: "email already taken", field: "form"}
                    }
                    else{
                        var exists = accActivation.getRecord({email: req.body.email, activationToken: req.body.otp_code})

                        if(exists.status){
                            // save the user
                        }
                    }
                }else{
                    console.log(data)
                }
            }

            return baseController.serverResponse(code, obj, res)
        })
    }
    
    getUsers = (req = null, res = null) =>{ 
        res.status(200).json({message: "This is really cool"})
    }

    save = async (postData)=>{
        await userModel.create(postData)
        .then(result => {
            return {status: true}
        })
        .catch(err=> {
            return {
                status: false,
                err
            }
        })
    }

    read = async (criteria = {})=>{
        try{
            var data = await userModel.find(criteria)
            return data
        }catch(err){
            return false
        }
    }

    readOne = async (criteria = {})=>{
        try{
            var data = await userModel.findOne(criteria)
            return {status: true, data}
        }catch(err){
            return {status: false, data: err}
        }
    }
}



module.exports = new userController