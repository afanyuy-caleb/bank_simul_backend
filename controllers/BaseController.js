// const accActivationModel = require('../models/Account_activation')
const transporter = require('../utils/sendEmail')
require('dotenv').config()

class baseController{
    generate_random(){
        let number = (Math.random() * 1000000).toString().padStart(6, '0')
        return Number.parseInt(number)
    }

    serverResponse (code, obj, res){
        res.status(code).json(obj)
    }
    
    async mailHandler(email, session = null){
        try{
            const expiresAt = new Date()
            const code = this.generate_random()
            expiresAt = expiresAt.setTime(Date.now() + 60*60*1000)
            
            await transporter.sendMail({
                from: process.env.USER_NAME,
                to: email,
                subject: session ? "Verification" : "Account activation",
                html: session ?
                `<p>Enter the code below to verify it is YOU <p> <br>
                <h2> ${code} </h2>`
                :
                `<p>Below is the code to activate you ASI membership account: <p><br>
                <h2> $code </h2>
                <p> The code expires at ${expiresAt} </p>`
            })

            return {status: true, msg: "message sent successfully"}

        }catch(err){
            return {status: false, msg: err}
        }


    }

}

module.exports = new baseController