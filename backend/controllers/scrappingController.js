const { default: mongoose } = require("mongoose");
const {
  checkForResults,
  validateEmail,
} = require("../helpers/schedularHelpers");
const { jobsDataModel } = require("../models/jobsModel");
const { pagesDataModel } = require("../models/pagesModel");
const { documentsDataModel } = require("../models/documentsModel");
const { notificationDataModel } = require("../models/notificationsModel");
const { addNotification } = require("./notificationController");
const xlsx = require("xlsx");
const fs = require("fs");
const { validateJobModel } = require("../models/verificationJobModel");
const { ValidateContactModel } = require("../models/verificationContactsModal");
const csv = require("csv-parser");
const contactEventEmitter = require("../events");
function generateUniqueId(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const scrappingController = async (req, res) => {
  try {
    let { searchKeyword, location, websiteUrl, name } = req.body;
    let searchRoute = `/search?search_terms=${searchKeyword}&geo_location_terms=${location}`;
    let searchUrl = websiteUrl + searchRoute;
    let check;
    try {
      check = await checkForResults(searchUrl, "#noResultsId", true);
    } catch (error) {
      return res.status(404).send({ message: error.message });
    }
    if (check) {
      const uniqueId = generateUniqueId(10); // Specify the desired length
      try {
        let job = await jobsDataModel.findOne({ name });
        if (job) {
          return res
            .status(409)
            .send({ message: "Job with name already exists" });
        }
        job = await jobsDataModel.create({
          jobId: uniqueId,
          websiteUrl: websiteUrl,
          jobStatus: "Queued",
          searchUrl: searchUrl,
          searchKeyword: searchKeyword,
          location: location,
          scheduler: {
            name: "Scrape links",
            message: "Queued for scrapping",
          },
          name: name,
        });
        return res
          .status(200)
          .send({ jobId: job._id, message: "Queued job sccessfullly" });
      } catch (error) {
        console.log(error);
        throw error;
      }
    } else {
      return res
        .status(404)
        .send({ message: "No search results found for the keywords" });
    }
  } catch (error) {
    let errorMessage = error?.message;
    if (errorMessage && errorMessage.includes("duplicate key error")) {
      const regex = /dup key: { (.*) }/;
      const match = error.message.match(regex);
      return res
        .status(409)
        .send({ message: `Job with search keywords already exists.` });
    } else {
      return res.status(500).send({ message: "Error scheduling scraping job" });
    }
  }
};

const requestToValidate = async (req, res) => {
  try {
    console.log("called");
    const { type } = req.body;
    if (type === "file") {
      const file = req.file;
      if (!file) {
        res.status(400).send({ message: "No file uploaded." });
        return;
      }

      const filePath = file.path;
      const [fileName, fileExt] = file.originalname.split(".");
      // if (fileExt === "xls" || fileExt === "xlsx") {
      //   await handleXLSX(filePath, res, fileName);
      // } else
      let contacts = [];
      let completedIn = null;
      if (fileExt === "csv") {
        let response = await formatCsvFile(filePath, res, fileName);
        contacts = response.contacts;
        completedIn = response.completedIn;
      } else {
        return res.status(400).send({ message: "Unsupported file format." });
      }
      if (contacts.length > 0) {
        try {
          const uniqueId = generateUniqueId(5);
          let validationJob = await validateJobModel.create({
            jobId: uniqueId,
            status: "Requested",
            name: fileName,
          });
          let newContacts = contacts.map((contact) => ({
            ...contact,
            jobRefId: validationJob._id,
            _id: new mongoose.Types.ObjectId(),
          }));
          await ValidateContactModel.insertMany(newContacts);
          const currentDate = new Date();
          const completionDate = new Date(
            currentDate.getTime() + completedIn * 1000
          );
          contactEventEmitter.emit("contactsInserted", validationJob);
          const formattedDate = completionDate.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          });
          validationJob.completedIn = completionDate;
          await validationJob.save();
          res.status(200).send({
            messsage: "Requested for validation",
            contacts,
          });
        } catch (error) {
          throw error;
        }
      } else {
        res.status(404).send({ messsage: "Empty file" });
      }
    }
  } catch (error) {
    console.log(error);
    let message = error.message ? error.message : "Internal server error";
    console.log(message);
    res.status(500).send({ message });
  }
};

const validateEmailsOnUpload = async (job) => {
  try {
    const formatDateString = (date) => {
      return new Date(date);
    };

    let contacts = await ValidateContactModel.find({ jobRefId: job._id });
    if (contacts.length > 0) {
      for (let contact of contacts) {
        if (contact.status === "notVerified") {
          let valid=(await validateEmail(contact.email));
          if(valid==="Failed"){
            contact.status = valid;
          }else if (valid===true) {
            contact.status = "valid";
          } else if(valid===false) {
            contact.status = "invalid";
          }
          // contact.status = (await validateEmail(contact.email))
          //   ? "valid"
          //   : "invalid";
          await contact.save();
        }
      }

      job.status = "Completed";
      const currentDate = new Date();
      const completionDate = currentDate;

      if (job.completedIn) {
        const previousCompletionDate = formatDateString(job.completedIn);
        console.log(
          "previousCompletionDate========>",
          completionDate > previousCompletionDate
        );

        if (completionDate > previousCompletionDate) {
          job.completedIn = completionDate.toISOString();
        } else {
          job.completedIn = completionDate.toISOString();
        }
      } else {
        job.completedIn = completionDate.toISOString();
      }

      await job.save();
    }
  } catch (error) {
    console.error("Error validating emails:", error);
    job.status = "Failed";
    await job.save();
  }
};

// const formatCsvFile = async (filePath) => {
//   const contacts = [];
//   let contact = {};
//   let emailIndex = false;
//   let emailcurrentIndex = 0;
//   let statusCurrentIndex = null;
//   try {
//     const data = fs.readFileSync(filePath, "utf-8");
//     const rows = data.split("\n");
//     if (rows.length === 0) {
//       throw { message: "No content found" };
//     }
//     // console.log(rows);
//     for (let i = 0; i < rows.length; i++) {
//       console.log(rows[i]);

//       const row = rows[i].split(",");
//       if (i === 0 && row.length > 0) {
//         let j = 0;
//         for (let title of row) {
//           if (title !== "status") {
//             contact[title] = "";
//             if (title === "email") {
//               emailIndex = true;
//               emailcurrentIndex = j;
//             }
//           } else {
//             statusCurrentIndex = j;
//           }
//           j++;
//         }
//       }
//       if (row.length > 0 && i > 0) {
//         let j = 0;
//         let keys = Object.keys(contact);
//         let newContact = { ...contact };
//         for (let key of keys) {
//           // if (row[j]) {
//           if (statusCurrentIndex !== null && j === statusCurrentIndex) {
//             newContact[key] = row[j + 1];
//           } else {
//             newContact[key] = row[j];
//           }
//           // }
//           j++;
//         }
//         let emailFound = contacts.find(
//           (el) => el.email === row[emailcurrentIndex]
//         );
//         let foundEmailInDb = await ValidateContactModel.findOne({
//           email: row[emailcurrentIndex],
//         });
//         console.log(foundEmailInDb);
//         if (!emailFound && !foundEmailInDb) {
//           console.log(newContact);
//           contacts.push(newContact);
//         }
//       }
//     }
//     if (!emailIndex) {
//       throw { message: "Missing email field" };
//     } else if (emailIndex && contacts.length === 0) {
//       throw { message: "Duplicate file uploads or emails are not permitted" };
//     } else {
//       fs.unlinkSync(filePath);
//       // console.log(contacts);
//       return { contacts, completedIn: contacts.length * 2 };
//     }

//     // res.json({ validEmails, invalidEmails });
//   } catch (error) {
//     console.error("Error reading file:", error);
//     throw error;
//   }
// };

const formatCsvFile = async (filePath) => {
  const contacts = [];
  const contactFields = {};
  let emailIndex = false;
  let emailcurrentIndex = 0;
  let statusCurrentIndex = null;

  return new Promise((resolve, reject) => {
    const promises = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        headers.forEach((header, index) => {
          if (header !== "status") {
            contactFields[header] = "";
            if (header === "email") {
              emailIndex = true;
              emailcurrentIndex = index;
            }
          } else {
            statusCurrentIndex = index;
          }
        });
      })
      .on("data", (row) => {
        if (!emailIndex) {
          reject({ message: "Missing email field" });
          return;
        }

        const newContact = { ...row };
        delete newContact.status;

        promises.push(
          // ValidateContactModel.findOne({ email: newContact.email }).then(
          //   (foundEmailInDb) => {
          // console.log("foundEmailInDb=====>", foundEmailInDb
          (() => {
            if (
              !contacts.find((el) => el.email === newContact.email) &&
              newContact.email
            ) {
              contacts.push(newContact);
            }
          })()

          //   }
        );
        // );
      })
      .on("end", async () => {
        let x = await Promise.all(promises); // Wait for all async operations to complete
        // console.log("contacts==========>", contacts);
        // let newContacts = [];

        // for (let contact of contacts) {
        //   let foundEmailInDb = await ValidateContactModel.findOne({
        //     email: contact.email,
        //   });
        //   console.log("foundEmailInDb===>", foundEmailInDb);
        //   if (!foundEmailInDb) {
        //     newContacts.push(contact);
        //   }
        // }
        // console.log("contacts==========>", newContacts);

        const hasDuplicates = contacts.length === 0;
        if (hasDuplicates) {
          fs.unlinkSync(filePath);
          reject({
            message: "Duplicate file uploads or emails are not permitted",
          });
        } else {
          fs.unlinkSync(filePath);
          resolve({
            contacts: contacts,
            completedIn: contacts.length * 4,
          });
        }
      })
      .on("error", (error) => {
        fs.unlinkSync(filePath);

        console.error("Error reading file:", error);
        reject(error);
      });
  });
};

const requestToScrape = async (req, res) => {
  try {
    let { jobId } = req.params;
    let { jobStatus } = req.body;
    let objectId = new mongoose.Types.ObjectId(jobId);
    let jobDoc = null;
    let scheduler = {
      name: "Scrape links",
      message: "Requested for scrapping",
    };

    if (jobStatus === "Requested" || jobStatus === "Paused") {
      jobDoc = await jobsDataModel.findOneAndUpdate(
        { _id: objectId },
        { jobStatus: jobStatus },
        { new: true } // To return the updated document
      );
      let data = {
        status: jobStatus,
        scheduler: jobDoc.scheduler,
        jobRefId: jobDoc._id,
        jobId: jobDoc.jobId,
      };
      await addNotification(data);
    } else if (jobStatus === "Resume") {
      let pausedJob = await jobsDataModel.findOne({
        _id: objectId,
        jobStatus: "Paused",
      });

      if (pausedJob) {
        if (
          pausedJob.scheduler.name === "Scrape links" &&
          pausedJob.scheduler.message !== "Process completed"
        ) {
          pausedJob.jobStatus = "Requested";
          pausedJob.scheduler = scheduler;
          await pausedJob.save();
          jobDoc = pausedJob;
        } else if (
          pausedJob.scheduler.name === "Scrape emails" &&
          pausedJob.scheduler.message !== "Process completed"
        ) {
          pausedJob.jobStatus = "Inprogress";
          await pausedJob.save();
          jobDoc = pausedJob;
        } else if (pausedJob.scheduler.message === "Process completed") {
          pausedJob.jobStatus = "Completed";
          await pausedJob.save();
          jobDoc = pausedJob;
        }

        let pages = await pagesDataModel.find({
          jobRefId: pausedJob._id,
          status: "Paused",
        });

        if (pages.length > 0) {
          for (let page of pages) {
            page.status = "Completed";
            page.scheduler = {
              name: "Scrape links",
              message: "Process completed",
            };
            await page.save();
          }
        }
      }
    } else if (jobStatus === "Restart") {
      jobDoc = await jobsDataModel.findOne({
        _id: objectId,
        jobStatus: "Suspended",
      });

      if (jobDoc) {
        await pagesDataModel.deleteMany({ jobRefId: jobDoc._id });
        await documentsDataModel.deleteMany({ jobRefId: jobDoc._id });
        await notificationDataModel.deleteMany({ jobRefId: jobDoc._id });
        jobDoc.jobStatus = "Requested";
        jobDoc.scheduler = scheduler;
        await jobDoc.save();
      }
    }

    if (!jobDoc) {
      return res.status(404).send({ message: "Job not found" });
    } else {
      return res.status(200).send({
        message: `Job requested to ${
          jobStatus === "Requested" ? "start" : jobStatus.toLowerCase()
        } `,
      });
    }
  } catch (error) {
    console.error("Error updating job status:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const handleCSV = async (filePath, res, fileName) => {
  const validEmails = [];
  const invalidEmails = [];
  let contact = {};
  let emailIndex = 0;
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const rows = data.split("\n");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].split(",");
      if (i === 0 && row.length > 0) {
        let j = 0;
        for (let title of row) {
          contact[title] = "";
          if (title === "email") {
            emailIndex = j;
          }
          j++;
        }
      }
      if (row.length > 0 && i > 0) {
        try {
          const emailValidation = await validateEmail(row[emailIndex]);
          if (emailValidation) {
            let j = 0;
            let keys = Object.keys(contact);
            for (let key of keys) {
              if (row[j]) {
                contact[key] = row[j];
              }
              j++;
            }
            validEmails.push(contact);
          }
        } catch (error) {
          console.error("Error validating email:", error);
        }
      }
    }

    if (validEmails.length > 0) {
      validEmails.push({ fileName });
      res.status(200).send({ validEmails });
    } else {
      res.status(400).send("No valid emails found");
    }
    fs.unlinkSync(filePath);
    // res.json({ validEmails, invalidEmails });
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(500).json({ error: "Error reading file" });
  }
};

async function handleXLSX(filePath, res, fileName) {
  try {
    const validEmails = [];

    const workbook = xlsx.readFile(filePath);
    const sheet_name_list = workbook.SheetNames;
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    for (const row of data) {
      try {
        if (!row.email) {
          throw "Email field is missing";
        }
        let emailValidate = await validateEmail(row.email);
        if (emailValidate.valid) {
          validEmails.push(row);
        }
      } catch (error) {
        throw error;
        console.log(error, "error");
      }
    }
    if (validEmails.length > 0) {
      validEmails.push({ fileName });
      res.status(200).send({ validEmails });
    } else {
      res.status(400).send("No valid emails found");
    }
    fs.unlinkSync(filePath);
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occured try after sometime");
  }
}

let uploadEmails = async (req, res) => {
  console.log("called");
  const { type } = req.body;
  if (type === "file") {
    const file = req.file;
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    }

    const filePath = file.path;
    const [fileName, fileExt] = file.originalname.split(".");
    if (fileExt === "xls" || fileExt === "xlsx") {
      await handleXLSX(filePath, res, fileName);
    } else if (fileExt === "csv") {
      await handleCSV(filePath, res, fileName);
    } else {
      res.status(400).send("Unsupported file format.");
    }
  } else if (type === "list") {
    let { list } = req.body;
    list = JSON.parse(list);
    const validEmails = [];
    for (const row of list) {
      try {
        let emailValidate = await validateEmail(row.email);
        if (emailValidate.valid) {
          validEmails.push(row);
        }
      } catch (error) {
        console.log(error, "error");
      }
    }
    if (validEmails.length > 0) {
      res.status(200).send(validEmails);
    } else {
      res.status(400).send({ message: "No valid emails found" });
    }
  }
};

const deleteValidationJob = async (req, res) => {
  try {
    let { jobId } = req.params;
    let objectId = new mongoose.Types.ObjectId(jobId);
    await ValidateContactModel.deleteMany({ jobRefId: objectId });
    await validateJobModel.deleteOne({ _id: objectId });

    res.status(200).send({ message: "Deleted job successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const downloadValidationJob = async (req, res) => {
  try {
    let { jobId } = req.params;
    let objectId = new mongoose.Types.ObjectId(jobId);
    let validContacts = await ValidateContactModel.find(
      { jobRefId: objectId, status: "valid" },
      { status: 0 }
    );
    res.status(200).send(validContacts);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const getValidationJobs = async (req, res) => {
  try {
    let response = await validateJobModel.find().sort({ _id: -1 });

    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const resumeValidationOnStart = async () => {
  try {
    let jobs = await validateJobModel.find({ status: "Requested" });
    if (jobs.length > 0) {
      for (let job of jobs) {
        validateEmailsOnUpload(job);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const objectId = new mongoose.Types.ObjectId(jobId);

    // Delete the job
   
    const deletedJob = await jobsDataModel.findOneAndDelete({ _id: objectId });
    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }
    await pagesDataModel.deleteMany({ jobRefId: objectId });
    // Delete related documents
    await notificationDataModel.updateMany(
      { jobRefId: objectId },
      { deleted: true }
    );
    await documentsDataModel.deleteMany({ jobRefId: objectId });
    res
      .status(200)
      .json({ message: "Job and related documents deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  scrappingController,
  requestToScrape,
  uploadEmails,
  requestToValidate,
  validateEmailsOnUpload,
  getValidationJobs,
  deleteValidationJob,
  downloadValidationJob,
  resumeValidationOnStart,
  deleteJob,
};
