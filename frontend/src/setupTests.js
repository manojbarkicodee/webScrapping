import "@testing-library/jest-dom";
import Enzyme from "enzyme";
import Adapter from "@cfaester/enzyme-adapter-react-18";

jest.unstable_mockModule("node:child_process", () => ({
  execSync: jest.fn(),
  // etc.
}));
jest.mock("@mui/material/TablePagination/TablePaginationActions", () => ({
  __esModule: true,
  default: () => {},
}));

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({ data: [] })),
    get: jest.fn(() => Promise.resolve({ data: [] })),
  },
}));

// const {execSync} = await import('node:child_process');

// etc.

Enzyme.configure({
  adapter: new Adapter(),
});
