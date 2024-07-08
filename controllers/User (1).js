'use strict'

const multer = require('multer')
const userModel = require('../models/User')
const {imgFields, uploadFields} = require('../middleware/File')
const accActivation = require('../models/Account_activation')
const bcrypt = require('bcrypt')
const account = require('./Account')
const baseController = require('./BaseController')
const accActController = require('./AccountActivation')
const fs = require('fs').promises

class userController{

    generateHash = (pass)=>{
        return bcrypt.hashSync(pass, 10)
    }

    createUserObject = ()=>{
        var user = {}
        var body = this.req.body
        var arr = Object.keys(body)
        arr.forEach(item =>{
            if(['page', 'acc_type', 'passcnf', 'otp_code'].indexOf(item) == -1){

                if(item == 'pass'){
                    body[item] = this.generateHash(body[item])
                }
                if(item == 'dob'){
                    body[item] = new Date(body[item])
                }
                user[item] = body[item]
            }
        })

        let files = this.req.files

       for(let key in files){
        user[key] = files[key][0].filename
       }
        return user
    }
    
    middleWareHandler = (err, res, req) =>{
        // Custom middleware error handler
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ msg: err.message.toLowerCase()+ ', max file size is 4Mb', field: err.field });
            }
    
            return res.status(400).json({ error: err.message.toLowerCase() });
        }

        var validData = baseController.validateData(req.body)
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
        this.req = req
        this.res = res

        imgFields(req, res, async (err)=>{
            var {code, obj} = this.middleWareHandler(err, res, req)

            console.log(req.body.tel)

            if(obj.status){

                // Check if the user already exists
                var {status, data} = await baseController.readOne(userModel, { $or: [{email: req.body.email},{tel: req.body.tel}]})

                console.log(status, data)

                if(!status || data){
                    if(req.body.email === data?.email){
                        obj = {status: false, msg: "email already taken", field: "email"}
                    }else{
                        obj = {status: false, msg: "tel number already taken", field: "tel"}
                    }
                    return baseController.serverResponse(409, obj, res)
                }

                // save to the db
                var token = baseController.generate_random(6)

                var {status, msg} = await accActController.addRecord({
                    email : req.body.email,
                    activationToken: token,
                    expiresAt: new Date(Date.now() + 60*30*1000)
                })

                if(!status){
                    obj = {status, msg, field: "form"}
                    return baseController.serverResponse(400, obj, res)
                }

                var {status, msg} = await baseController.mailHandler(req.body.email, token)

                code = status ? 200: 400;
                obj = {status, msg, field: "form"}
            }

            return baseController.serverResponse(code, obj, res)
        })
    }
    
    addUser = (req, res) =>{
        this.req = req
        this.res = res

        uploadFields(req, res, async (err)=>{
            var {code, obj} = this.middleWareHandler(err, res, req)
            if(! obj.status){
                return baseController.serverResponse(code, obj, res)
            }

            // Check if the user exists
            var {status, data} = await baseController.readOne(userModel, {email: req.body.email})
            if(! status){
                obj = {status: false, msg: data, field: "form"}
                return baseController.serverResponse(501, obj, res)
            }

            if(data !== null){
                // Record exists
                obj = {status: false, msg: "email already taken", field: "email"}
                return baseController.serverResponse(409, obj, res)
            }
            // get the record from the account activation table
            var {status, data} = await baseController.read(accActivation, {email: req.body.email, activationToken: req.body.otp_code})

            if(!status || (data.length == 0)){
                obj = {status: false, msg: "invalid otp code", field: "form"}
                return baseController.serverResponse(400, obj, res)
            }

            // create a user object and then save it
            var {status, data} = await account.createAccount(req.body.acc_type)

            if(!status){
                obj = {status: false, msg: data, field: "form"}
                return baseController.serverResponse(409, obj, res)
            }

            var user = this.createUserObject()
            user['acc_nb'] = data

            // Update the account activation log
            const acc_update = baseController.updateOne(accActivation, {email: user.email}, {active: true})

            // Save the user to the DB
            const saved = await this.save(user)
            if(!saved.status){
                var {code, keyValue} = saved.err
                let field = ''
                if(code == 11000){
                    field = Object.keys(keyValue)[0]
                }

                // Delete the images

                obj = {status: false, msg: "tel number already taken    ", field}
                return baseController.serverResponse(400, obj, res)
            }
            


            return baseController.serverResponse(200, obj, res)
        })
    }
    
    getUser = async (req, res) =>{ 
        console.log(req.body.otp_code)
        var {email, otp_code} = req.body
        var {status, data} = await baseController.readOne(accActivation, {email, activationToken: parseInt(otp_code)})
        var obj = {}

        console.log(data)

        if(!status || !data){
            obj = {status, msg: "Invalid code", field: "form"}
            return baseController.serverResponse(200, obj, res)
        }

        var {status, data} = baseController.readOne(userModel, {email})

        obj = {status, msg: data, field: "form"}
        return baseController.serverResponse(200, obj, res)

    }

    login = async (req, res)=>{
        const {email, pass} = req.body
        // Check whether or not the user exists in the db
        var {status, data} = await baseController.readOne(userModel, {email})

        if(!status || ! data){
            var obj = {status: false, msg: "Invalid login credentials", field: "form"}
            return baseController.serverResponse(200, obj, res)
        }

        // confirm the password
        if(! bcrypt.compareSync(pass, data.pass)){
            obj = {status: false, msg: "Invalid login credentials", field: "form"}
            return baseController.serverResponse(200, obj, res)
        }

        // Check if the user just recently logged in
        var active = baseController.readOne(accActivation, {email})
        if(!active.status || !active.data){

            // Save the code to the db
            const token = baseController.generate_random(6)
            var saving = await accActController.addRecord({
                email,
                activationToken: token,
                expiresAt: new Date(Date.now() + 60*30*1000)
            })

            if(! saving.status){
                obj = {status: saving.status, msg: saving.msg, field: "form"}
                return baseController.serverResponse(400, obj, res)
            }

            // Send the otp link
            const mail = await baseController.mailHandler(email, token, "login")
            let code = mail.status ? 200 : 400

            obj = {status: mail.status, msg: mail.msg, field: "form"}
            return baseController.serverResponse(code, obj, res)
        }

        obj = {status: true, msg: data, field: "form"}
        return baseController.serverResponse(200, obj, res)
    }

    save = async (postData)=>{
        let user = new userModel(postData)

        try{
            await user.save()
            return {status: true}
        }catch(err){
            return {
                status: false,
                err
            }
        }
    }
}

module.exports = new userController