const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
require('dotenv').config()

const PORT = process.env.PORT || 3001

const app = express()

app.use('/users', userRoutes)

app.use(express.static('public'))

app.use(express.json({limit: "50mb", extended: false}))
app.use(express.urlencoded({limit: "50mb", extended: false}))
app.use(cors())

app.get('/', (req, res)=>{
    // res.header('Access-Control-Allow-Origin', '*')
    res.status(200).json({message: "everything is indeed okay at the root"})
})

mongoose.connect("mongodb://localhost:27017/bank_db")
.then(app.listen(PORT))
.catch(error => console.error("db connection error: " + error.message))