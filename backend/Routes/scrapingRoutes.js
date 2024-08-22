const express = require("express");
const {
  searchKeywordValidatorSchema,
  statusUpdateSchema,
  jobIdParamsSchema,
  fileSchema,
  listSchema,
} = require("../validations/validation_schema");
const {
  requestBodyValidator,
  requestParamsValidations,
} = require("../validations/ validation_middlewares");
const {
  scrappingController,
  requestToScrape,
  uploadEmails,
  requestToValidate,
  getValidationJobs,
  deleteValidationJob,
  downloadValidationJob,
} = require("../controllers/scrappingController");
const multer = require("multer");
const webScrapeRouter = express.Router();

webScrapeRouter.post(
  "/scrap/queued",
  requestBodyValidator(searchKeywordValidatorSchema),
  scrappingController
);

webScrapeRouter.post(
  "/scrap/statusUpdate/:jobId",
  requestParamsValidations(jobIdParamsSchema),
  requestBodyValidator(statusUpdateSchema),
  requestToScrape
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
webScrapeRouter.post(
  "/validateEmails",
  upload.single("file"),
  (req, res, next) => {
    const { type } = req.body;
    console.log(type);
    if (type === "file") {
      requestBodyValidator(fileSchema);
      next();
    } else if (type === "list") {
      requestBodyValidator(listSchema);
      next();
    } else {
      return res.status(400).send("Invalid type.");
    }
  },
  requestToValidate
);

webScrapeRouter.get("/validationJobs", getValidationJobs);

webScrapeRouter.delete("/deleteValidationJob/:jobId", deleteValidationJob);

webScrapeRouter.get("/validContacts/:jobId", downloadValidationJob);
module.exports = { webScrapeRouter };
