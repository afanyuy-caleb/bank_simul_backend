module.exports = baseController = {
    serverResponse (code, obj, res){
        res.status(code).json(obj)
    },

    mailHandler(){
        return this.name
    }

}