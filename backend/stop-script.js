// stop-script.js
require("dotenv").config();
const mongoose = require('mongoose');
const { jobsDataModel } = require('./models/jobsModel');
// const jobsDataModel = require('./path-to-your-jobs-data-model'); // Replace with your actual path

async function updateJobStatusOnServerDown() {
  try {
    let jobs = await jobsDataModel.find({
      jobStatus: { $nin: ["Verified", "Queued"] }
    });

    for (let jobDoc of jobs) {
      jobDoc.jobStatus = "Suspended";
      await jobDoc.save();
    }

    console.log("Job statuses have been updated successfully");
  } catch (error) {
    console.log(error);
  } finally {
    mongoose.connection.close();
  }
}

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    updateJobStatusOnServerDown();
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
