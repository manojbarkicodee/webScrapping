const mongoose = require("mongoose");

// Define a schema for each document object within contacts array

// Define the main job schema
const notificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "Requested",
        "Completed",
        "Verified",
        "Failed",
        "Inprogress",
        "Paused"
      ],
    },
    scheduler: {
      name: {
        type: String,
      },
      message: {
        type: String,
      },
    },
    jobId: {
      type:String,
      ref: "Job", // Reference to the Job model
      required: true,
    },
    jobRefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job", // Reference to the Job model
      required: true,
    },
    deleted: {
      type: Boolean,
      default: false, // Default value, contacts are not deleted by default
    },
  },
  { timestamps: true }
);

const notificationDataModel = mongoose.model(
  "Notification",
  notificationSchema
);

module.exports = { notificationDataModel };
