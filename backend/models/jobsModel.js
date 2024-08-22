const mongoose = require("mongoose");

// Define a schema for each document object within contacts array

// Define the main job schema
const jobSchema = new mongoose.Schema(
  {
    websiteUrl: {
      type: String,
      required: true,
    },
    searchUrl: {
      type: String,
      unique: true,
    },
    jobStatus: {
      type: String,
      enum: [
        "Queued",
        "Requested",
        "Completed",
        "Verified",
        "Failed",
        "Inprogress",
        "Suspended",
        "Paused",
        "No Emails"
      ],
    },
    name:{
      type:String,
      unique:true,
      required:true
    },
    statusHistory:[
      {
        status:{
          type:String,
          enum: [
            "Queued",
            "Requested",
            "Completed",
            "Verified",
            "Failed",
            "Inprogress",
            "Suspended",
            "Paused"
          ],
        },
         createdAt: {
          type: Date,
          default: Date.now,
        },
        scheduler: {
          name: {
            type: String,
          },
          message: {
            type: String,
          },
        },
      }
    ],
    scheduler: {
      name: {
        type: String,
      },
      message: {
        type: String,
      },
    },
    searchKeyword: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    jobId:String,
    pausedAt:{
      type:Number,
      default:0
    }
  },
  { timestamps: true }
);

const jobsDataModel = mongoose.model("Job", jobSchema);

module.exports = { jobsDataModel };
