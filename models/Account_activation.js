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
  }},
  {timestamps: true}
);

accActSchema.index({expiresAt: 1}, {expireAfterSeconds: 3600})

module.exports = mongoose.model("AccountActivation", accActSchema);