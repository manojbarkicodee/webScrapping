const Cheerio = require("cheerio");
const { default: axios } = require("axios");
const { default: validate } = require("deep-email-validator");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { addPage } = require("../controllers/pages.Controller");
const { documentsDataModel } = require("../models/documentsModel");
const { jobsDataModel } = require("../models/jobsModel");

let loadHtmlPage = async (url) => {
  try {
    let response = await axios.get(url);
    const html = response.data;
    const $ = new Cheerio.load(html);
    return $;
  } catch (error) {
    throw error;
  }
};

let reqToCollectLinksAndScrapeData = async (jobDoc, pageNo) => {
  try {
    let page = pageNo;
    let newSearchUrl = jobDoc.searchUrl;
    let pageFound = await checkForResults(newSearchUrl, "#no-results");
    let paused = await jobsDataModel.findOne({
      _id: jobDoc._id,
      jobStatus: "Paused",
    });
    while (pageFound && !paused && page <= 100) {
      await delay(100);
      let scrapingData = [];
      if (page > 1) {
        newSearchUrl = jobDoc.searchUrl + `&page=${page}`;
      }
      let pageData = {
        pageNo: page,
        jobRefId: jobDoc._id,
        jobId: jobDoc.jobId,
        status: "Inprogress",
        pageUrl: newSearchUrl,
        scheduler: {
          name: "Scrape links",
          message: "scheduler in progress",
        },
      };
      let currentPage = await addPage(pageData);
      try {
        let $ = await loadHtmlPage(newSearchUrl);
        let content = $(".search-results");
        let contentArray = content.find(".srp-listing");
        contentArray.each((i, element) => {
          let title = $(element).find(".business-name").find("span").text();
          let nextRoute = $(element).find(".business-name").attr("href");
          const websiteUrl = $(element)
            .find(".track-visit-website")
            .attr("href");
          const phoneNumber = $(element)
            .find(".phones.phone.primary")
            .text()
            .trim();
          if (title) {
            scrapingData.push({
              title,
              nextRoute,
              websiteUrl,
              phoneNumber,
              jobRefId: jobDoc._id,
              jobId: jobDoc.jobId,
              pageRefId: currentPage._id,
            });
          }
        });
        await delay(500);
      } catch (error) {
        console.log(error.message, "inner");
        currentPage.status = "Failed";
        currentPage.scheduler.message = error.message ? error.message : error;
        await currentPage.save();
        // continue;
        // throw error;
      }
      if (scrapingData.length > 0) {
        for (let data of scrapingData) {
          try {
            await documentsDataModel.create({ ...data });
          } catch (error) {
            console.log(error.message);
          }
        }
        currentPage.status = "Completed";
        (currentPage.scheduler.message = "Process completed"),
          await currentPage.save();
      } else {
        currentPage.status = "Nocontacts";
        (currentPage.scheduler.message = "Contacts not found"),
          await currentPage.save();
      }

      ++page;
      if (page > 1) {
        newSearchUrl = jobDoc.searchUrl + `&page=${page}`;
      }
      pageFound = await checkForResults(newSearchUrl, "#no-results");
      paused = await jobsDataModel.findOne({
        _id: jobDoc._id,
        jobStatus: "Paused",
      });
      console.log(pageFound, "pageFound", page, "====>2");
    }
    if (paused) {
      jobDoc.pausedAt = page;
      await jobDoc.save();
    }
    return { status: "Completed", message: "Process completed" };
  } catch (error) {
    console.log(error.message, "outter");
    return { status: "Failed", message: error.message ? error.message : error };
  }
};

let reqToCollectEmails = async (scrapingData, jobDoc, pageDoc) => {
  try {
    let i = 1;
    let paused = await jobsDataModel.findOne({
      _id: jobDoc._id,
      jobStatus: "Paused",
    });
    for (let element of scrapingData) {
      let newScrapingData = {};
      let navUrl = jobDoc.websiteUrl + element.nextRoute;
      // console.log(navUrl, i);
      try {
        let $ = await loadHtmlPage(navUrl);
        let email = $(".email-business").attr("href");
        if (email) {
          const emailRegex = /mailto:([^\s]+)/;
          const match = email.match(emailRegex);

          if (match) {
            const emailId = match[1];
            newScrapingData = {
              ...element,
              email: emailId,
              extractionInfo: {
                status: "Found",
                message: "Email found",
                scheduler: "Scrape emails",
              },
            };
          }
        } else {
          newScrapingData = {
            ...element,
            extractionInfo: {
              status: "NotFound",
              message: "Email not found",
              scheduler: "Scrape emails",
            },
          };
        }
      } catch (error) {
        console.log(error.message, "error in reqToCollectEmails");
        newScrapingData = {
          ...element,
          extractionInfo: {
            status: "Failed",
            message: error.message ? error.message : error,
            scheduler: "Scrape emails",
          },
        };
        if (newScrapingData._id) {
          delete newScrapingData._id;
        }
        await documentsDataModel.updateOne(
          { jobRefId: jobDoc._id, _id: element._id },
          { $set: newScrapingData }
        );
        console.log("404 Error: Page not found, skipping...");

        continue;
      }

      if (newScrapingData._id) {
        delete newScrapingData._id;
      }
      await documentsDataModel.updateOne(
        { jobRefId: jobDoc._id, _id: element._id },
        { $set: newScrapingData }
      );
      if (paused) {
        break;
      } else {
        paused = await jobsDataModel.findOne({
          _id: jobDoc._id,
          jobStatus: "Paused",
        });
      }
      await delay(700); // Delay between requests
      i++;
    }
    if (paused) {
      return { status: "Paused", message: "process paused", paused: true };
    } else {
      return { status: "Completed", message: "Process completed" };
    }
  } catch (error) {
    console.log(error.message, "error in outer catch");
    return { status: "Failed", message: error.message ? error.message : error };
  }
};

let checkForResults = async (url, noResultsId, check) => {
  try {
    const $ = await loadHtmlPage(url);
    let noResults = $(noResultsId);
    if (noResults.length > 0) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    if (check) {
      throw error;
    } else {
      return true;
    }
  }
};

// async function validateEmail(email) {
//   console.log("validation email",email )
//   let defaultDomains = [
//     "com",
//     "com.au",
//     "com.tw",
//     "ca",
//     "co.nz",
//     "co.uk",
//     "de",
//     "fr",
//     "it",
//     "ru",
//     "net",
//     "org",
//     "edu",
//     "gov",
//     "jp",
//     "nl",
//     "kr",
//     "se",
//     "eu",
//     "ie",
//     "co.il",
//     "us",
//     "at",
//     "be",
//     "dk",
//     "hk",
//     "es",
//     "gr",
//     "ch",
//     "no",
//     "cz",
//     "in",
//     "net",
//     "net.au",
//     "info",
//     "biz",
//     "mil",
//     "co.jp",
//     "sg",
//     "hu",
//     "uk",
//   ];
//   let additionalTopLevelDomains = [];
//   const domainRegex = /@.*\.([a-zA-Z]{2,})$/;
//   let match = email.match(domainRegex);
//   if (match) {
//     let domain = match[1];
//     if (!defaultDomains.includes(domain)) {
//       console.log(domain)
//       additionalTopLevelDomains.push(domain);
//     }
//   }
//   try {
//     console.log("validation email====>123",email )
//     let validation = await validate({
//       email: email,
//       sender: "manoj.vinno@gmail.com",
//       validateRegex: true,
//       validateMx: true,
//       validateTypo: true,
//       validateDisposable: true,
//       validateSMTP: true,
//       // additionalTopLevelDomains: additionalTopLevelDomains,
//     });
//     console.log("validation===>",validation)
//     return validation.valid;
//   } catch (error) {
//     console.log("email validation error",error);
//     return false;
//   }
// }

// boneal@withyoudowntheroad.com
async function validateEmail(email) {
  console.log("validation email", email);
  let defaultDomains = [
    "com",
    "com.au",
    "com.tw",
    "ca",
    "co.nz",
    "co.uk",
    "de",
    "fr",
    "it",
    "ru",
    "net",
    "org",
    "edu",
    "gov",
    "jp",
    "nl",
    "kr",
    "se",
    "eu",
    "ie",
    "co.il",
    "us",
    "at",
    "be",
    "dk",
    "hk",
    "es",
    "gr",
    "ch",
    "no",
    "cz",
    "in",
    "net",
    "net.au",
    "info",
    "biz",
    "mil",
    "co.jp",
    "sg",
    "hu",
    "uk",
  ];
  let additionalTopLevelDomains = [];
  const domainRegex = /@.*\.([a-zA-Z]{2,})$/;
  let match = email.match(domainRegex);
  if (match) {
    let domain = match[1];
    if (!defaultDomains.includes(domain)) {
      console.log(domain);
      additionalTopLevelDomains.push(domain);
    }
  }

  const validatePromise = async () => {
    try {
      console.log("validation email====>123", email);
      let validation = await validate({
        email: email,
        sender: "manoj.vinno@gmail.com",
        validateRegex: true,
        validateMx: true,
        validateTypo: true,
        validateDisposable: true,
        validateSMTP: true,
        additionalTopLevelDomains: additionalTopLevelDomains,
      });
      // console.log("validation===>", validation);
      return validation.valid;
    } catch (error) {
      console.log("email validation error", error);
      return "Failed";
    }
  };

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      // console.log("Email validation timed out.",email);
     return resolve("Failed");
    }, 600000); // 10 minutes
  });
  const result=await Promise.race([validatePromise(), timeoutPromise]);
  console.log("result=========>",result)
  return result
}

const reqToSecondLevelEmailExtraction = async (scrapingData) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const secondaryPages = [
    "contact us",
    "about us",
    "support",
    "help",
    "faq",
    "customer service",
    "feedback",
  ];

  try {
    let newScrapingData = [];
    let i = 1;

    for (let element of scrapingData) {
      let navUrl = element.websiteUrl;

      try {
        let $ = await loadHtmlPage(navUrl);
        let emails = [];

        $('a[href^="mailto:"]').each((i, el) => {
          const email = $(el).attr("href").replace("mailto:", "");
          emails.push(email);
        });

        $("p, span, div, li, td").each((i, el) => {
          const text = $(el).text();
          const foundEmails = text.match(emailRegex);
          if (foundEmails) {
            emails.push(...foundEmails);
          }
        });

        // Return unique email addresses (remove duplicates)
        emails = [...new Set(emails)];

        if (emails.length > 0) {
          newScrapingData = [
            ...newScrapingData,
            {
              ...element,
              email: emails,
              extractionInfo: {
                status: "Found",
                message: "email Found",
                scheduler: "2nd level email scrapper",
              },
            },
          ];
        } else {
          let foundEmails = false;

          for (const page of secondaryPages) {
            const next = $(`a:contains("${page}")`).attr("href");

            if (next) {
              try {
                const $ = await loadHtmlPage(navUrl + next);
                $('a[href^="mailto:"]').each((i, el) => {
                  const email = $(el).attr("href").replace("mailto:", "");
                  emails.push(email);
                });

                $("p, span, div, li, td").each((i, el) => {
                  const text = $(el).text();
                  const foundEmails = text.match(emailRegex);
                  if (foundEmails) {
                    emails.push(...foundEmails);
                  }
                });

                // Return unique email addresses (remove duplicates)
                emails = [...new Set(emails)];

                if (emails.length > 0) {
                  newScrapingData = [
                    ...newScrapingData,
                    {
                      ...element,
                      email: emails,
                      extractionInfo: {
                        status: "Found",
                        message: "email Found",
                        scheduler: "2nd level email scrapper",
                      },
                    },
                  ];
                  foundEmails = true;
                  break;
                }
              } catch (error) {
                // console.log(error, "error in reqToCollectEmails");
                if (error.response) {
                  console.log("404 Error: Page not Found, skipping...");
                  newScrapingData = [
                    ...newScrapingData,
                    {
                      ...element,
                      extractionInfo: {
                        status: "Failed",
                        message: error.message,
                        scheduler: "2nd level email scrapper",
                      },
                    },
                  ];
                  continue; // Move to the next iteration of the loop
                }
              }
              // throw error;
            }
            await delay(700);
          }

          if (!foundEmails) {
            console.log(
              "No emails Found on main or secondary pages. Skipping..."
            );
            newScrapingData = [
              ...newScrapingData,
              {
                ...element,
                extractionInfo: {
                  status: "NotFound",
                  message: "email not Found",
                  scheduler: "2nd level email scrapper",
                },
              },
            ];
          }
        }
      } catch (error) {
        // console.log(error, "error in reqToCollectEmails");
        if (error.response) {
          console.log("404 Error: Page not Found, skipping...");
          newScrapingData = [
            ...newScrapingData,
            {
              ...element,
              extractionInfo: {
                status: "Failed",
                message: error.message,
                scheduler: "2nd level email scrapper",
              },
            },
          ];
          continue; // Move to the next iteration of the loop
        }
        // throw error;
      }

      await delay(700);
      i++;
    }

    return newScrapingData;
  } catch (error) {
    console.log(error, "error in outer catch");
    throw error;
  }
};

const updateJobStatusOnServerDown = async () => {
  try {
    let jobs = await jobsDataModel.find({
      jobStatus: { $nin: ["Verified", "Queued"] },
    });

    for (let jobDoc of jobs) {
      jobDoc.jobStatus = "Suspended";
      await jobDoc.save();
    }
  } catch (error) {
    console.log(error.message, "updateJobStatusOnServerDown");
  }
};

module.exports = {
  reqToCollectLinksAndScrapeData,
  reqToCollectEmails,
  checkForResults,
  loadHtmlPage,
  validateEmail,
  reqToSecondLevelEmailExtraction,
  updateJobStatusOnServerDown,
};
