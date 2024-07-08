const express = require('express')
const cors = require('cors')
const {addUser, activateUser, login, getUser} = require('../controllers/User')
const router = express.Router()

router.use(express.json({limit: "50mb", extended: false}))
router.use(express.urlencoded({limit: "50mb", extended: false}))
router.use(cors())

router.get('/', (req, res)=>{
    res.status(200).json({message: "This is quite what i expected"})
})

router.post('/activate', activateUser)
router.post('/register', addUser)
router.post('/login', login)
router.post('/getUser', getUser)

module.exports = router