const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, default: null },
    nextRoute: { type: String, default: null },
    websiteUrl: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    email: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      validate: {
        validator: function (v) {
          return (
            v === null ||
            typeof v === "string" ||
            (Array.isArray(v) && v.every((email) => typeof email === "string"))
          );
        },
        message: (props) => `${props.value} is not a valid email format!`,
      },
    },
    status: {
      type: String,
      enum: ["valid", "invalid", "notVerified","Failed"],
      default: "notVerified",
    },
    extractionInfo: {
      status: {
        type: String,
        enum: ["Failed", "Found", "NotFound", "Pending"],
        default: "Pending",
      },
      message: { type: String, default: "Not yet requested" },
      scheduler: { type: String, default: "Scrape emails" },
    },
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
    pageRefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job", // Reference to the Job model
      required: true,
    },

  },
  { timestamps: true }
);

const documentsDataModel = mongoose.model("Document", documentSchema);

module.exports = { documentsDataModel };
