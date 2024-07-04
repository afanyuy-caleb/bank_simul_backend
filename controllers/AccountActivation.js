const accActivationModel = require('../models/Account_activation')

class accountActivation{
    addRecord = async (postData) =>{
        const record = new accActivationModel(postData)
        try{
            await record.save()
            return {status: true, msg: "record added successfully"}

        }catch(err){
            return {status: false, msg: err.message}
        }
    }
    
    getRecord = async(criteria = {}) =>{
        try{
            const data = await accActivationModel.find(criteria)
            return {status: true, data}
        }catch(err){
            return {status: false, err}
        }
    }

    deleteRecord = async (criteria = {}) =>{
        try{
            await accActivationModel.deleteMany(criteria)
            return {status: true, msg: "delete successful"}
        }catch(err){
            return {status: false, msg: err.message}
        }
    }
}

module.exports = new accountActivation
