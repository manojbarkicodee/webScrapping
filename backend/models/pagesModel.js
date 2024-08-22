const mongoose = require("mongoose");

const pagesSchema = new mongoose.Schema({
  pageNo: { type: Number, required: true },
  jobRefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job", // Reference to the Job model
    required: true,
  },
  jobId: {
    type: String,
    ref: "Job", // Reference to the Job model
    required: true,
  },
  status: {
    type: String,
    enum: [
      "Requested",
      "Completed",
      "Verified",
      "Failed",
      "Inprogress",
      "Nocontacts",
      "Paused"
    ],
  },
  pageUrl:{
   type:String,
   unique:true
  },
  scheduler: {
    name: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  paused:{
    type:Boolean,
    default:false
  }
});

const pagesDataModel = mongoose.model("Page", pagesSchema);

module.exports = { pagesDataModel };