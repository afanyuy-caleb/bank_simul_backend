const fs = require('fs')
const path = require('path')

class accController{
    generate_random(){
        var num = Math.random() * 100000000
        num = num.toString().padStart(9, 1)
        num = num.spit().sort(()=>Math.random() - 0.5).join('')
    
        return parseInt(num)
    }

    generateAccountNumber(){
        try{
            const dir = path.join(__dirname, '..', 'utils', 'accId.txt')
            var id = 1;
            if(fs.existsSync(dir)){
                id = fs.readFileSync(dir)
            }
            var numb = this.generate_random() + id
            fs.writeFileSync(dir, id++)
    
            return {status: true, data: numb}
        }catch(err){
            return {status: false, data: err}
        }
    }

    createAccount(){
        
    }
}

module.exports = accController;
