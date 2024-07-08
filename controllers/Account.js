const fs = require('fs')
const path = require('path')
const accountModel = require('../models/Account');
const baseController = require('./BaseController');

class accController{
    generateAccountNumber(){
        try{
            const dir = path.join(__dirname, '..', 'utils', 'accId.txt')
            var id = 1;
            if(fs.existsSync(dir)){
                id = fs.readFileSync(dir)
            }
            var numb = baseController.generate_random(10) + parseInt(id)
            fs.writeFileSync(dir, (id++).toString())
            return {status: true, data: numb}
        }catch(err){
            return {status: false, data: err.message}
        }
    }

    createAccount = async (type) =>{
        const {status, data} = this.generateAccountNumber()

        if(!status){
            return {status, data}
        }
        const accObj = {
            acc_number : data,
            acc_type: type
        }
        try{
            await accountModel.create(accObj)
            return {status: true, data}

        }catch(err){
            return {status: false, data : err.message}
        }   
    }
}

module.exports = new accController;
