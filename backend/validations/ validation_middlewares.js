const requestBodyValidator = function (options) {
  return async (req, res, next) => {
    const { error, value } = options.validate.payload.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
        },
      });
    } else {
      next();
    }
  };
};

const requestQueryValidations = function (options) {
  return async (req, res, next) => {
    const { error, value } = options.validate.query.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
        },
      });
    } else {
      next();
    }
  };
};

const requestParamsValidations = function (options) {
  return async (req, res, next) => {
    const { error, value } = options.validate.params.validate(req.params);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
        },
      });
    } else {
      next();
    }
  };
};

module.exports = {
  requestBodyValidator,
  requestQueryValidations,
  requestParamsValidations,
};
