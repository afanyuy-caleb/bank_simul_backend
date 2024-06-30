const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const userModel = require('../models/User')
const imgFields = require('./File')
const baseController = require('./BaseController')
const validator = require('validator')

const activateUser = (req, res, next) =>{
    imgFields(req, res, (err)=>{
        if(!req.files && !req.file){
            return res.status(400).json({message: "No files included"}); 
        }
        if (err) {
           return res.status(400).json({message: err.message});
        } 
        res.status(200).json({message: "success"})
    })
}

const addUser = (req, res) =>{
    console.log(req.body)
}

const getUsers = (req, res) =>{
    res.status(200).json({message: "This is really cool"})
}

module.exports = {
    addUser,
    getUsers,
    activateUser,
};          