const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accActSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  activationToken: {
    type: Number,
    required: true
  },
  expiresAt:{
    type: Date,
    expires: '1h',
    required: true
  } 
});

module.exports = mongoose.model("AccountActivation", accActSchema);