const accActivationModel = require('../models/Account_activation')

class accountActivation{
    addRecord = async (postData) =>{
        try{
            await accActivationModel.updateMany({email: postData.email}, postData, {upsert: true})
            return {status: true, msg: "record added successfully"}

        }catch(err){
            return {status: false, msg: err.message}
        }
    }
}

module.exports = new accountActivation
