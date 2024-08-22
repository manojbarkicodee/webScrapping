const Joi = require("joi");

const searchKeywordValidatorSchema = {
  validate: {
    payload: Joi.object({
      websiteUrl: Joi.string().required(),
      searchKeyword: Joi.string().required(),
      location: Joi.string().required(),
      websiteType: Joi.string().valid(
        "in",
        "us",
        "googlemaps",
        "yelp",
        "newus",
        "google"
      ),
      limit: Joi.number(),
      name:Joi.string().required()
    }),
  },
};

const statusUpdateSchema = {
  validate: {
    payload: Joi.object({
      jobStatus: Joi.string().valid("Requested", "Paused", "Resume", "Restart"),
    }),
  },
};



const getJobsSchema = {
  validate: {
    query: Joi.object({
      websiteUrl: Joi.string().valid("https://www.yellowpages.com"),
      search: Joi.string(),
      jobStatus:Joi.string().valid("Verified")
    }),
  },
};

const getDocumentsSchema = {
  validate: {
    query: Joi.object({
      status: Joi.string().valid("valid", "invalid", "notVerified"),
      email: Joi.boolean().valid(true),
      websiteUrl: Joi.boolean().valid(true),
      phoneNumber: Joi.boolean().valid(true),
      jobs:Joi.string()
    }),
  },
};

const getDocumentsParamsSchema = {
  validate: {
    params: Joi.object({
      jobRefId: Joi.string().hex().length(24),
    }),
  },
};
const notificationParams = {
  validate: {
    params: Joi.object({
      notificationId: Joi.string().hex().length(24),
    }),
  },
};
const jobIdParamsSchema = {
  validate: {
    params: Joi.object({
      jobId: Joi.string().hex().length(24),
    }),
  },
};

const fileSchema ={
  validate: {
    payload: Joi.object({
  type: Joi.string().valid('file').required(),
})
  }
};

const listSchema ={
  validate: { payload: Joi.object({
  type: Joi.string().valid('list').required(),
  list: Joi.string().required(), // Expecting list to be a JSON string
})
  }
};
module.exports = {
  searchKeywordValidatorSchema,
  getJobsSchema,
  getDocumentsParamsSchema,
  getDocumentsSchema,
  statusUpdateSchema,
  notificationParams,
  jobIdParamsSchema,
  fileSchema,
  listSchema
};
