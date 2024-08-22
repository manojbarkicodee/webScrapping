const { jobsDataModel } = require("../models/jobsModel");

const getJobs = async (req, res) => {
  try {
    let { websiteUrl, search,jobStatus } = req.query;
    let query = {};

    if (websiteUrl) {
      query.websiteUrl = websiteUrl;
    }

    if(jobStatus){
      query.jobStatus = jobStatus;
    }

    if (search) {
      query.$or = [
        { searchKeyword: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const jobs = await jobsDataModel.find(query).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getJobs };
