const express = require("express");
const {
  requestQueryValidations,
  requestParamsValidations,
} = require("../validations/ validation_middlewares");
const {
  getJobsSchema,
  jobIdParamsSchema,
} = require("../validations/validation_schema");
const { getJobs } = require("../controllers/jobController");
const { deleteJob } = require("../controllers/scrappingController");

const jobRouter = express.Router();

jobRouter.get("/jobs", requestQueryValidations(getJobsSchema), getJobs);

jobRouter.delete(
  "/deleteJob/:jobId",
  requestParamsValidations(jobIdParamsSchema),
  deleteJob
);

module.exports = { jobRouter };
