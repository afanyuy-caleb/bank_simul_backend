module.exports = baseController = {
    name: 'Cals',
    serverResponse (status, message, field, res){
        res.json({ status, message, field })
    },

    mailHandler(){
        return this.name
    }

}