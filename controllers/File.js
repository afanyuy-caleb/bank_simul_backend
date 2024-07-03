const multer = require('multer')
const path = require('path')
const {v4 : uuid} = require('uuid')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        return cb(null, './public/uploads')
    },
    filename: function(req, file, cb){
        var new_name = uuid() + path.extname(file.originalname) 
        return cb(null, new_name)
    }
});

const upload = multer({
    storage, 
    limits: {
        fileSize: 1024*1024*4
    },
    fileFilter: function(req, file, cb){
        if(file.mimetype.startsWith('image')){
            cb(null, true)
        }else{
            msg = JSON.stringify({msg:"invalid file extension", picField: file.fieldname })
            cb(new Error(msg), false)
        }
    }
})

const imgFields = upload.fields([
    {name: 'identity', maxCount: 1},
    {name: 'profilePic', maxCount: 1}
])

module.exports = imgFields