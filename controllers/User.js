'use strict'

const multer = require('multer')
const userModel = require('../models/User')
const {imgFields, uploadFields, uploadNone} = require('../middleware/File')
const accActivation = require('../models/Account_activation')
const bcrypt = require('bcrypt')
const account = require('./Account')
const baseController = require('./BaseController')
const accActController = require('./AccountActivation')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

class userController{

    generateHash = (pass)=>{
        return bcrypt.hashSync(pass, 10)
    }

    deleteImages = async () =>{
        let files = this.req.files

        for (let file in this.req.files){
            let file_name = files[file][0].filename

            let file_path = path.join(__dirname, '..', 'public', 'uploads', file_name)

            try{
                if(fs.existsSync(file_path)){
                    await fsPromises.unlink(file_path)
                    console.log("Files deleted successfully")
                }
            }
            catch(err){
                console.log(err)
            }
        }
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

            if(obj.status){

                // Check if the user already exists
                var {status, data} = await baseController.readOne(userModel, { $or: [{email: req.body.email},{tel: req.body.tel}]})

                if(!status || data){
                    if(req.body.email === data?.email){
                        obj = {status: false, msg: "email already taken", field: "email"}
                    }else{
                        obj = {status: false, msg: "phone number already taken", field: "tel"}
                    }
                    return baseController.serverResponse(409, obj, res)
                }

                // save to the db
                var token = baseController.generate_random(6)

                var {status, msg} = await accActController.addRecord({
                    email : req.body.email,
                    activationToken: token,
                    expiresAt: new Date(Date.now() + 60*30*1000),
                    active: false
                })

                if(!status){
                    obj = {status, msg, field: "form"}
                    return baseController.serverResponse(400, obj, res)
                }

                var {status, msg} = await baseController.mailHandler(req.body.email, token)
                
                code = status? 200 : 400;
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
                await this.deleteImages()
                return baseController.serverResponse(code, obj, res)
            }

            // Check if the user exists
            var {status, data} = await baseController.readOne(userModel, {email: req.body.email})
            if(! status){
                await this.deleteImages()
                obj = {status: false, msg: data, field: "form"}
                return baseController.serverResponse(501, obj, res)
            }

            if(data !== null){
                // Record exists
                await this.deleteImages()
                obj = {status: false, msg: "email already taken", field: "email"}
                return baseController.serverResponse(409, obj, res)
            }
            // get the record from the account activation table
            var {status, data} = await baseController.read(accActivation, {email: req.body.email, activationToken: req.body.otp_code})

            if(!status || (data.length == 0)){
                await this.deleteImages()
                obj = {status: false, msg: "Invalid otp code", field: "form"}
                return baseController.serverResponse(400, obj, res)
            }

            // create a user object and then save it
            var {status, data} = await account.createAccount(req.body.acc_type)

            if(!status){
                await this.deleteImages()
                obj = {status: false, msg: data, field: "form"}
                return baseController.serverResponse(409, obj, res)
            }

            var user = this.createUserObject()
            user['acc_nb'] = data

            // Update the account activation log
            const acc_update = await baseController.updateOne(accActivation, {email: user.email}, {active: true})

            // Save the user to the DB
            const saved = await this.save(user)
            if(!saved.status){
                var {code, keyValue} = saved.err
                let field = ''
                if(code == 11000){
                    field = Object.keys(keyValue)[0]
                }

                // Delete the images
                await this.deleteImages()

                obj = {status: false, msg: "phone number already taken", field}
                return baseController.serverResponse(400, obj, res)
            }
            
            return baseController.serverResponse(200, obj, res)
        })
    }
    
    getUser = async (req, res) =>{ 
       
        uploadNone(req, res, async (err)=>{
            var {email, otp_code} = req.body
            
            var {status, data} = await baseController.readOne(accActivation, {email})
            var obj = {}
    
            if(!status || !data){
                obj = {status: false, msg: "Invalid code", field: "form"}
                return baseController.serverResponse(200, obj, res)
            }
    
            // Update the account activation log
            const acc_update = await baseController.updateOne(accActivation, {email}, {active: true})
    
            var {status, data} = await baseController.readOne(userModel, {email})
    
            let file_path = path.join(__dirname, '..', 'public', 'uploads', data.profilePic)
            let file_path2 = path.join(__dirname, '..', 'public', 'uploads', data.identity)
            try{
                data.profilePic = await fsPromises.readFile(file_path)
                data.identity = await fsPromises.readFile(file_path2)
            } catch(error){
                obj = {status: false, msg: error.msg, field: "form"}
                return baseController.serverResponse(400, obj, res)
            }
    
            obj = {status, msg: data, field: "form"}
            return baseController.serverResponse(200, obj, res)
        })
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

        // Check if the user just recently logged in or just registered
        var active = await baseController.readOne(accActivation, {email, active: true})
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

        // Convert the file to a buffer
        let file_path = path.join(__dirname, '..', 'public', 'uploads', data.profilePic)
        let file_path2 = path.join(__dirname, '..', 'public', 'uploads', data.identity)
        try{
            data.profilePic = await fsPromises.readFile(file_path)
            data.identity = await fsPromises.readFile(file_path2)
        } catch(error){
            obj = {status: false, msg: error.msg, field: "form"}
            return baseController.serverResponse(400, obj, res)
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