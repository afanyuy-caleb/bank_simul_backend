const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accActSchema = new Schema({
  email: {
    type: String,
  },
  activationToken: Number,
  expirationTime: Date
});

module.exports = mongoose.model("AccountActivation", accActSchema);