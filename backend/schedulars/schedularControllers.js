const { jobsDataModel } = require("../models/jobsModel");

const { documentsDataModel } = require("../models/documentsModel");
const {
  reqToCollectEmails,
  reqToCollectLinksAndScrapeData,
  loadHtmlPage,
  validateEmail,
  reqToSecondLevelEmailExtraction,
} = require("../helpers/schedularHelpers");

const { addNotification } = require("../controllers/notificationController");
const { pagesDataModel } = require("../models/pagesModel");
const { notificationDataModel } = require("../models/notificationsModel");

const processScrapingJob = async () => {
  try {
    const processingEmailJobs = await jobsDataModel.findOne({
      jobStatus: "Requested",
      "scheduler.name": "Scrape links",
    });

    if (processingEmailJobs) {
      let jobDoc = processingEmailJobs;

      if (jobDoc && jobDoc.jobStatus === "Requested") {
        jobDoc.jobStatus = "Inprogress";
        jobDoc.scheduler = {
          name: "Scrape links",
          message: "scheduler in progress",
        };
        await jobDoc.save();
        let data = {
          status: "Inprogress",
          scheduler: {
            name: "Scrape links",
            message: "scheduler in progress",
          },
          jobRefId: jobDoc._id,
          jobId: jobDoc.jobId,
        };
        let checkForNotification = await notificationDataModel.findOne({
          jobRefId: jobDoc._id,
          status: "Inprogress",
          "scheduler.name": "Scrape links",
        });

        if (jobDoc.jobStatus !== "Paused" && !checkForNotification) {
          await addNotification(data);
        }
        try {
          let pageNo = 1;
          if (jobDoc.pausedAt) {
            pageNo = jobDoc.pausedAt;
          }
          let scrapingData = await reqToCollectLinksAndScrapeData(
            jobDoc,
            pageNo
          );

          let checkPuase = await jobsDataModel.findOne({ _id: jobDoc._id });
          if (checkPuase.jobStatus !== "Paused") {
            jobDoc.jobStatus = scrapingData.status;
            jobDoc.scheduler = {
              name: "Scrape links",
              message: scrapingData.message,
            };
            await jobDoc.save();
            let data = {
              status: scrapingData.status,
              scheduler: {
                name: "Scrape links",
                message: scrapingData.message,
              },
              jobRefId: jobDoc._id,
              jobId: jobDoc.jobId,
            };
            await addNotification(data);
            console.log(
              `Job Scrape links ${jobDoc._id} Completed and data stored.`
            );
          } else {
            console.log(
              `Job Scrape links ${jobDoc._id} Completed and data stored.`
            );
          }
        } catch (error) {
          console.log(error.message, "shedular");
          jobDoc.jobStatus = "Failed";
          jobDoc.scheduler = {
            name: "Scrape links",
            message: error.message ? error.message : error,
          };
          await jobDoc.save();
          let data = {
            status: "Failed",
            scheduler: {
              name: "Scrape links",
              message: error.message ? error.message : error,
            },
            jobRefId: jobDoc._id,
            jobId: jobDoc.jobId,
          };
          await addNotification(data);
          throw error;
        }
      }
    }
  } catch (error) {
    jobDoc.jobStatus = "Failed";
    jobDoc.scheduler = {
      name: "Scrape links",
      message: error.message ? error.message : error,
    };
    await jobDoc.save();
    let data = {
      status: "Failed",
      scheduler: {
        name: "Scrape links",
        message: error.message ? error.message : error,
      },
      jobRefId: jobDoc._id,
      jobId: jobDoc.jobId,
    };
    await addNotification(data);
    console.log(error.message);
  }
};

const processEmailJobs = async () => {
  try {
    const processingEmailJobs = await pagesDataModel.findOne({
      status: "Completed",
      "scheduler.name": "Scrape links",
    });
    if (processingEmailJobs) {
      let pageDoc = processingEmailJobs;
      const jobDoc = await jobsDataModel.findOne({ _id: pageDoc.jobRefId });
      if (
        jobDoc.jobStatus === "Completed" &&
        jobDoc.scheduler.name === "Scrape links"
      ) {
        jobDoc.jobStatus = "Inprogress";
        jobDoc.scheduler = {
          name: "Scrape emails",
          message: "scheduler in progress",
        };
        await jobDoc.save();
        let notificationCheck = await notificationDataModel.findOne({
          status: "Inprogress",
          "scheduler.name": "Scrape emails",
          jobRefId: jobDoc._id,
        });
        let data = {
          status: "Inprogress",
          scheduler: {
            name: "Scrape emails",
            message: "scheduler in progress",
          },
          jobRefId: jobDoc._id,
          jobId: jobDoc.jobId,
        };
        if (!notificationCheck) {
          await addNotification(data);
        }
      }

      (pageDoc.status = "Inprogress"),
        (pageDoc.scheduler = {
          name: "Scrape emails",
          message: "scheduler in progress",
        });
      await pageDoc.save();
      let scrapingData = await documentsDataModel
        .find({ pageRefId: pageDoc._id, jobRefId: pageDoc.jobRefId })
        .select("-__v")
        .lean();
      if (pageDoc.paused) {
        scrapingData = await documentsDataModel
          .find({
            pageRefId: pageDoc._id,
            jobRefId: pageDoc.jobRefId,
            "extractionInfo.status": "Pending",
          })
          .select("-__v")
          .lean();
        pageDoc.paused = false;
        await pageDoc.save();
      }

      try {
        let newScrapingData = await reqToCollectEmails(scrapingData, jobDoc);

        pageDoc.status = newScrapingData.status;
        pageDoc.scheduler = {
          name: "Scrape emails",
          message: newScrapingData.message,
        };
        await pageDoc.save();
        console.log(`EXTRACTED EMAILS FOR PAGE ${pageDoc.pageNo} AND FOR JOB ${pageDoc.jobId}`);
        let newJobDoc = await jobsDataModel.findOne({ _id: pageDoc.jobRefId });
        if (
          newJobDoc.jobStatus === "Inprogress" &&
          newJobDoc.scheduler.name === "Scrape emails"
        ) {
          let lastPageArray = await pagesDataModel
            .find({ jobRefId: newJobDoc._id })
            .sort({ pageNo: -1 })
            .exec();
          let lastPage = lastPageArray[0];
          if (
            lastPage.pageNo === pageDoc.pageNo &&
            (lastPage.scheduler.name === "Scrape emails" ||
              (lastPage.scheduler.name === "Scrape links" &&
                (lastPage.status === "Nocontacts" ||
                  lastPage.status === "Failed")))
          ) {
            let documents = await documentsDataModel.find({
              email: { $ne: null },jobRefId:newJobDoc._id
            });
            console.log(documents)
            if (documents.length > 0) {
              newJobDoc.jobStatus = "Completed";
            } else {
              newJobDoc.jobStatus = "No Emails";
            }
            newJobDoc.scheduler = {
              name: "Scrape emails",
              message: "Process completed",
            };
            await newJobDoc.save();
            let notificationCheck = await notificationDataModel.findOne({
              status: "Completed",
              "scheduler.name": "Scrape emails",
              jobRefId: newJobDoc._id,
            });
            let data = {
              status: "Completed",
              scheduler: {
                name: "Scrape emails",
                message: "Process completed",
              },
              jobRefId: newJobDoc._id,
              jobId: newJobDoc.jobId,
            };
            if (!notificationCheck) {
              await addNotification(data);
            }
          }
        }
        console.log(`Job ${jobDoc._id} Completed`);
      } catch (error) {
        pageDoc.status = "failed";
        pageDoc.scheduler = {
          name: "Scrape emails",
          message: error.message ? error.message : error,
        };
        await pageDoc.save();

        console.log(error, "error in shedular");
      }
    }
  } catch (error) {
    pageDoc.status = "Failed";
    pageDoc.scheduler = {
      name: "Scrape emails",
      message: error.message ? error.message : error,
    };
    await pageDoc.save();

    console.log(error);
  }
};

const processEmailVerificationJob = async () => {
  try {
    let emails = await documentsDataModel.find({
      email: { $ne: null },
      status: "notVerified",
    });
    console.log("validation job started=======>",emails.length);
    for (let element of emails) {
      let emailId = element.email;
      // if (typeof emailId === "string") {
      // console.log(element)
        let valid = await validateEmail(emailId);
        if(valid==="Failed"){
          console.log("email status===>","Failed");
          element.status = valid;
        }else if (valid===true) {
          element.status = "valid";
        } else if(valid===false) {
          element.status = "invalid";
        }
        try{
          console.log("email status===>",valid,element.email);
          await element.save();

        }catch(error){
          console.log(error)
        }

        let verified=await jobsDataModel.findOne({jobRefId:element.jobRefId,jobStatus:"Verified"});

        if(verified){
          break;
        }
      // } else {
      //   let validate = false;
      //   for (let email of emailId) {
      //     const emailRegex = /mailto:([^\s]+)/;
      //     const match = email.match(emailRegex);

      //     if (match) {
      //       emailId = match[1];
      //     }
      //     let valid = await validateEmail(email);
      //     if (valid) {
      //       element.status = "valid";
      //       element.email = email;
      //       validate = true;
      //       break;
      //     }
      //   }

      //   if (validate) {
      //     await element.save();
      //   } else {
      //     element.status = "invalid";
      //     await element.save();
      //   }
      // }
      // emails = await documentsDataModel.find({
      //   email: { $ne: null },
      //   status: "notVerified",
      // });
    }
  } catch (error) {
    console.log(error);
  }
};

const proccessingSecondLevelEmailExtraction = async () => {
  try {
    const processingEmailJobs = await jobsDataModel.findOne({
      jobStatus: "Completed",
      scheduler: { name: "Scrape emails" },
    });
    if (processingEmailJobs) {
      let jobDoc = processingEmailJobs;
      let scrapingData = await documentsDataModel
        .find({
          jobRefId: jobDoc._id,
          "extractionInfo.status": "NotFound",
          websiteUrl: { $ne: null },
        })
        .select("-__v")
        .lean();
      jobDoc.scheduler = {
        name: "2nd level email scrapper",
        message: "scheduler in progress",
      };
      await jobDoc.save();
      try {
        let newScrapingData = await reqToSecondLevelEmailExtraction(
          scrapingData
        );

        for (let data of newScrapingData) {
          let newData = { ...data };
          delete newData._id;
          await documentsDataModel.updateOne(
            { jobRefId: jobDoc._id, _id: data._id },
            { $set: newData }
          );
        }

        // jobDoc.jobStatus = "Completed";
        jobDoc.scheduler = {
          name: "2nd level email scrapper",
          message: "Process completed",
        };
        await jobDoc.save();

        console.log(`Job ${jobDoc._id} Completed`);
      } catch (error) {
        // jobDoc.jobStatus = "failed";
        // jobDoc.scheduler = {
        //   name: "Scrape emails",
        //   message: error.message ? error.message : error,
        // };
        // await jobDoc.save();
        console.log(error, "error in shedular");
        throw error;
      }
    }
  } catch (error) {}
};

const updateValidateStatus = async () => {
  try {
    let jobDocs = await jobsDataModel.find({
      jobStatus: "Completed",
      "scheduler.name": "Scrape emails",
    });
    console.log("check for validation updates====>")
    for (let job of jobDocs) {
      let validated = await documentsDataModel.find({
        jobRefId: job._id,
        email: { $ne: null },
        status: "notVerified",
      });
      if (validated.length === 0) {
        console.log("validation done=======>",job.name);
        (job.jobStatus = "Verified"),
          (job.scheduler = {
            name: "Validate emails",
            message: "Emails validation completed",
          });
        await job.save();
        let data = {
          status: "Verified",
          scheduler: {
            name: "Validate emails",
            message: "Process completed",
          },
          jobRefId: job._id,
          jobId: job.jobId,
        };
        await addNotification(data);
      }else{
        console.log("validation not done yet=======>",job.name,validated.length);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const restartOnProgress = async () => {
  try {
    let jobs = await jobsDataModel.find({
      jobStatus: "Inprogress",
    });
    let completedJobs = await jobsDataModel.find({
      jobStatus: "Completed",
      "scheduler.name": "Scrape links",
    });
    console.log("progress jobs===>",jobs.length)
    console.log("completed jobs",completedJobs.length);
    for (let jobDoc of jobs) {
      let lastStatus = jobDoc.statusHistory[jobDoc.statusHistory.length - 1];

      if (lastStatus.status === "Inprogress") {
        if (jobDoc.scheduler.name === "Scrape links") {
          await pagesDataModel.deleteMany({
            jobRefId: jobDoc._id,
            status: "Inprogress",
            "scheduler.name": "Scrape links",
          });
          let pages = await pagesDataModel
            .find({ jobRefId: jobDoc._id })
            .sort({ pageNo: -1 })
            .exec();
          jobDoc.jobStatus = "Requested";
          jobDoc.pausedAt = pages[0].pageNo + 1;
          await jobDoc.save();
        }
        let pages = await pagesDataModel
          .find({ jobRefId: jobDoc._id })
          .sort({ pageNo: -1 })
          .exec();
        if (pages.length > 0) {
          for (let page of pages) {
            if (
              page.status === "Inprogress" &&
              page.scheduler.name === "Scrape emails"
            ) {
              page.status = "Completed";
              page.scheduler = {
                name: "Scrape links",
                message: "Process completed",
              };
              page.paused = true;
              await page.save();
            }
          }
        }

        await jobDoc.save();

        console.log(
          `Job ${jobDoc._id} restart due to being Inprogress for more than 2 hours`
        );
      }
    }

    for (let job of completedJobs) {
      let pages = await pagesDataModel
        .find({ jobRefId: job._id })
        .sort({ pageNo: -1 })
        .exec();
        console.log("pages on scrape link completed job",pages.length)
      if (pages.length > 0) {
        for (let page of pages) {
          if (
            page.status === "Inprogress" &&
            page.scheduler.name === "Scrape emails"
          ) {
            page.status = "Completed";
            page.scheduler = {
              name: "Scrape links",
              message: "Process completed",
            };
            page.paused = true;
            await page.save();
          }
        }
      }
      console.log(
        `Job ${job._id} restart due to being Inprogress for more than 2 hours`
      );
    }
  } catch (error) {
    console.error("Error suspending jobs:", error);
  }
};

const validateEmailOnUpload = async () => {
  try {
  } catch (error) {}
};

module.exports = {
  loadHtmlPage,
  processScrapingJob,
  processEmailJobs,
  processEmailVerificationJob,
  proccessingSecondLevelEmailExtraction,
  updateValidateStatus,
  restartOnProgress,
};
