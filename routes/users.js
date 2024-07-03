const express = require('express')
const cors = require('cors')
const fs = require('fs')
const {addUser, activateUser} = require('../controllers/User')
const router = express.Router()
const imgFields = require('../controllers/File')

router.use(express.json({limit: "50mb", extended: false}))
router.use(express.urlencoded({limit: "50mb", extended: false}))
router.use(cors())

router.get('/', (req, res)=>{
    res.status(200).json({message: "This is quite what i expected"})
})

router.post('/register', addUser)
router.post('/activate', activateUser)

module.exports = router