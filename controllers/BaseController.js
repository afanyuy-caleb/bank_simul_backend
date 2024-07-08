require('dotenv').config()
const validator = require('validator')
const transporter = require('../utils/sendEmail')

class baseController{
    generate_random(length){
        var min = Math.pow(10, length-1)
        var num = Math.floor(Math.random() * (9 * min)) + min
        num = num.toString().padStart(length, 1)
        num = num.split().sort(()=>Math.random() - 0.5).join('')
    
        return parseInt(num)
    }

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

    serverResponse (code, obj, res){
        res.status(code).json(obj)
    }
    
    async mailHandler(email, code, session = null){
        try{
            var expiresAt = new Date()
            expiresAt.setTime(Date.now() + 60*30*1000)
            
            await transporter.sendMail({
                from: process.env.USER_NAME,
                to: email,
                subject: session ? "Verification" : "Account activation",
                html: session ?
                `<p>Enter the code below to verify it is YOU <p> <br>
                <h2> ${code} </h2>`
                :
                `<p>Below is the code to activate you ASI membership account: <p><br>
                <h2> ${code} </h2>
                <p> The code expires at ${expiresAt} </p>`
            })

            return {status: true, msg: "mail sent"}

        }catch(err){
            return {status: false, msg: err.message}
        }
    }
    
    read = async (model, criteria = {})=>{
        try{
            var data = await model.find(criteria).lean()
            return {status: true, data}
        }catch(err){
            return {status: false, data: err.message}
        }
    }

    readOne = async (model, criteria={})=>{
        try{
            var data = await model.findOne(criteria).lean()
            return {status: true, data}
        }catch(err){
            return {status: false, data: err.message}
        }
    }

    update = async (model, criteria = {}, data = {})=>{
        try{
            await model.updateMany(criteria, {$set: data})
            return {status: true}
        }catch(err){
            return {status: false, data: err.message}
        }
    }

    updateOne = async (model, criteria = {}, data = {})=>{
        try{
            await model.updateOne(criteria, {$set: data})
            return {status: true}
        }catch(err){
            return {status: false, data: err.message}
        }
    }

    delete = async (model, criteria = {})=>{
        try{
            await model.deleteMany(criteria)
            return {status: true, msg: "delete successful"}
        }catch(err){
            return {status: false, msg: err.message}
        }
    }
}

module.exports = new baseController