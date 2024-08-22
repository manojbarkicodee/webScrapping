const express = require("express");
const { getDocuments } = require("../controllers/documentsController");
const {
  requestParamsValidations,
  requestQueryValidations,
} = require("../validations/ validation_middlewares");
const {
  getDocumentsSchema,
  getDocumentsParamsSchema,
} = require("../validations/validation_schema");

const documentsRouter = express.Router();

documentsRouter.get(
  ["/contacts", "/contacts/:jobRefId"],
  requestParamsValidations(getDocumentsParamsSchema),
  requestQueryValidations(getDocumentsSchema),
  getDocuments
);

module.exports = { documentsRouter };
