const mongoose = require('mongoose');


const verificationContactsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    // unique:true,
    // match: [/.+\@.+\..+/, 'Please fill a valid email address'], // Optional email validation
  },
  jobRefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ValidateJob", // Reference to the Job model
    required: true,
  },
  status:{
    type: String,
    enum: ["valid", "invalid", "notVerified","Failed"],
    default: "notVerified",
  }
}, { strict: false }); // `strict: false` allows for any additional fields

const ValidateContactModel = mongoose.model('ValidateContact', verificationContactsSchema);

module.exports = {ValidateContactModel};
