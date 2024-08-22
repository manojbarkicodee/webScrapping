const mongoose = require("mongoose");
const { documentsDataModel } = require("../models/documentsModel");

let getDocuments = async (req, res) => {
  try {
    let { jobRefId } = req.params;
    let { status, email, websiteUrl, phoneNumber,jobs} = req.query;
    let query = {};
    if (jobRefId) {
      let objectId = new mongoose.Types.ObjectId(jobRefId);
      query.jobRefId = objectId;
    }
    if (email) {
      query.email = { $ne: null };
    }
    if (websiteUrl) {
      query.websiteUrl = { $ne: null };
    }
    if (phoneNumber) {
      query.phoneNumber = { $ne: null };
    }
    if (status) {
      query.status = status;
    }
    if(jobs){
      jobs=JSON.parse(jobs);
      let jobRefIds = jobs.map(id => new mongoose.Types.ObjectId(id));
      query.jobRefId = { $in: jobRefIds };
    }
    let contacts = await documentsDataModel
      .find(query)
      .populate({
        path: "jobRefId",
        model: "Job",
        match: { jobStatus: "Verified" },
      })
      .exec();
    contacts = contacts.filter(
      (doc) =>
        doc.jobRefId !== null &&
        doc.jobRefId.jobStatus === "Verified" &&
        doc.jobRefId.scheduler.name === "Validate emails"
    );
    res.status(200).send(contacts);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = { getDocuments };
