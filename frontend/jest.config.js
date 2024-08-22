module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  moduleNameMapper: {
    "^@mui/material/TablePagination/TablePaginationActions$":
      "<rootDir>/__mocks__/TablePaginationActions.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  transformIgnorePatterns: ["node_modules/(?!(axios)/)"],

  bail: 1,
  verbose: true,
};
