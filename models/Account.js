const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({
  acc_number: {
    type: String,
    required: true
  },
  acc_type: {
    type: String,
    enum: ['savings', 'checking'],
    default: 'checking',
    required: true
  },
  acc_balance: {
    type: Number,
    default: 0
  }
}, {timestamps: true});

module.exports = mongoose.model("Account", accountSchema);