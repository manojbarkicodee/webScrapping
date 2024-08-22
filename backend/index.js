const express = require("express");
const cors = require("cors");
const { connection } = require("./config/db");
require("dotenv").config();
const cron = require("node-cron");
const {
  processScrapingJob,
  processEmailJobs,
  processEmailVerificationJob,
  proccessingSecondLevelEmailExtraction,
  updateValidateStatus,
  restartOnProgress,
} = require("./schedulars/schedularControllers");
const { updateJobStatusOnServerDown, validateEmail } = require("./helpers/schedularHelpers");
const { webScrapeRouter } = require("./Routes/scrapingRoutes");
const { jobRouter } = require("./Routes/jobRouter");
const { documentsRouter } = require("./Routes/documentsRouter");
const { notificationRouter } = require("./Routes/notificationsRoute");
const { wss } = require("./websocket");
const http = require("http");
const WebSocket = require("ws");
const contactEventEmitter = require("./events");
const {
  validateEmailsOnUpload,
  resumeValidationOnStart,
} = require("./controllers/scrappingController");
const { jobsDataModel } = require("./models/jobsModel");
const { notificationDataModel } = require("./models/notificationsModel");
const { pagesDataModel } = require("./models/pagesModel");
const { addNotification } = require("./controllers/notificationController");
const { documentsDataModel } = require("./models/documentsModel");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json("welcome");
});

app.use("", webScrapeRouter);
app.use("", jobRouter);
app.use("", documentsRouter);
app.use("", notificationRouter);

// Schedule the scraping job to run every minute
cron.schedule(
  "* * * * *",
  async () => {
    await processScrapingJob();
  },
  { name: "Scrape links" }
);

// Schedule the email scraping job to run every 5 seconds
cron.schedule(
  "*/5 * * * * *",
  async () => {
    // console.log("Inprogress email scraping job every 5 seconds");
    await processEmailJobs();
  },
  { name: "Scrape emails" }
);

cron.schedule(
  "*/30 * * * * *",
  async () => {
    await processEmailVerificationJob();
  },
  { name: "validate emails" }
);

cron.schedule(
  "* * * * *",
  async () => {
    // console.log("Inprogress email verification job 10 seconds");
    await updateValidateStatus();
  },
  { name: "update status" }
);

cron.schedule(
  "* * * * *",
  async () => {
    let jobs = await jobsDataModel.find({
      jobStatus: "Completed",
      "scheduler.name": "Scrape links",
    });
    if (jobs.length === 0) {
      jobs = await jobsDataModel.find({
        jobStatus: "Inprogress",
        "scheduler.name": "Scrape emails",
      });
    }

    for (let job of jobs) {
      let pages = await pagesDataModel.find({
        status: "Inprogress",
        "scheduler.name": "Scrape emails",
        jobRefId: job._id,
      });

      console.log("pages==========>", pages.length);
      if (pages.length > 0) {
        job.jobStatus = "Inprogress";
        job.scheduler = {
          name: "Scrape emails",
          message: "scheduler in progress",
        };
        await job.save();
        let notificationCheck = await notificationDataModel.findOne({
          status: "Inprogress",
          "scheduler.name": "Scrape emails",
          jobRefId: job._id,
        });
        let data = {
          status: "Inprogress",
          scheduler: {
            name: "Scrape emails",
            message: "scheduler in progress",
          },
          jobRefId: job._id,
          jobId: job.jobId,
        };
        if (!notificationCheck) {
          await addNotification(data);
        }
      }

      let completedPages = await pagesDataModel.find({
        status: "Completed",
        "scheduler.name": "Scrape emails",
        jobRefId: job._id,
      });
      let failedPages=await pagesDataModel.find({
        status: "Failed",
        jobRefId: job._id,
      });

      let NoContacts=await pagesDataModel.find({
        status: "Nocontacts",
        jobRefId: job._id,
      });
      let totalPages = await pagesDataModel.find({
        jobRefId: job._id,
      });
      console.log("completedPages======>", (completedPages.length+failedPages.length+NoContacts.length),totalPages.length);
      if ((completedPages.length+failedPages.length+NoContacts.length) === totalPages.length) {
        let documents = await documentsDataModel.find({
          email: { $ne: null }, jobRefId: job._id,
        });
        console.log(documents)
        if (documents.length > 0) {
          job.jobStatus = "Completed";
        }else{
          job.jobStatus = "No Emails";
        } 
        // job.jobStatus = "Completed";
        job.scheduler = {
          name: "Scrape emails",
          message: "Process completed",
        };
        await job.save();
        let notificationCheck = await notificationDataModel.findOne({
          status: "Completed",
          "scheduler.name": "Scrape emails",
          jobRefId: job._id,
        });
        let data = {
          status: "Completed",
          scheduler: {
            name: "Scrape emails",
            message: "Process completed",
          },
          jobRefId: job._id,
          jobId: job.jobId,
        };
        if (!notificationCheck) {
          await addNotification(data);
        }
      }
    }
  },
  { name: "check status" }
);
// cron.schedule(
//   "* * * * *",
//   async () => {
//     console.log("Inprogress check each minutes");
//     await restartOnProgress();
//   },
//   { name: "check for inprogress status" }
// );
// Combine Express and WebSocket servers
const PORT = process.env.PORT || 8000;

// Create an HTTP server
const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit("connection", socket, request);
  });
});

// async function gracefulShutdown() {
//   console.log("Server is shutting down gracefully...");
//   try {
//     await updateJobStatusOnServerDown();
//   } catch (error) {
//     console.error("Error updating job statuses:", error);
//   }

//   server.close(() => {
//     console.log("Server has been gracefully terminated");
//     process.exit(0);
//   });

//   setTimeout(() => {
//     console.error("Forcibly terminating the server");
//     process.exit(1);
//   }, 10000); // 10 seconds
// }

// process.on("SIGINT", gracefulShutdown);
// process.on("SIGTERM", gracefulShutdown);

// Start the combined server

contactEventEmitter.on("contactsInserted", async (job) => {
  try {
    await validateEmailsOnUpload(job);
    console.log("Validation job completed.");
  } catch (error) {
    console.error("Error running validation job:", error);
  }
});
server.listen(PORT, async () => {
  try {
    await connection;
    console.log("Connected to DB successfully");
    await restartOnProgress();
    await resumeValidationOnStart();
  } catch (err) {
    console.log("Failed to connect to db");
    console.log(err);
  }
  console.log(`Server running at ${PORT}`);
});
