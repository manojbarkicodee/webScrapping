const mongoose = require("mongoose");

const verificationJobSchema = new mongoose.Schema({
  jobId: String,
  status: {
    type: String,
    enum: ["Requested", "Completed", "Failed", "Inprogress"],
  },
  completedIn:{
    type:Date,
    default:Date.now,
    required:true
  },
  name:{
    type:String,
    required:true
  }
});

const validateJobModel = mongoose.model("ValidateJob", verificationJobSchema);

module.exports = { validateJobModel };
