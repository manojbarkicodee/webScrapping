const express = require("express");
const {
  getNotications,
  deleteNotification,
} = require("../controllers/notificationController");
const {
  requestParamsValidations,
} = require("../validations/ validation_middlewares");
const { notificationParams } = require("../validations/validation_schema");

const notificationRouter = express.Router();

notificationRouter.get("/notifications", getNotications);

notificationRouter.delete(
  "/deleteNotification/:notificationId",
  requestParamsValidations(notificationParams),
  deleteNotification
);

module.exports = { notificationRouter };
