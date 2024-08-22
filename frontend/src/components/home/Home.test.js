import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "./Home";
import axios from "axios";
beforeEach(() => {
  jest.clearAllMocks(); // Reset mock implementation before each test
});
describe("Home component", () => {
  test("Render home component and drawer notfound", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={false} toggleDrawer={toggleDrawer}></Home>);

    let drawer = screen.queryByTestId("drawer");
    expect(drawer).toBeNull();
  });

  test("Check for drawer found", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={true} toggleDrawer={toggleDrawer}></Home>);
    let drawer = screen.queryByTestId("drawer");
    expect(drawer).toBeInTheDocument();
  });

  test("check for drawer close on drawer click", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={true} toggleDrawer={toggleDrawer}></Home>);
    let drawer = screen.queryByTestId("drawer");
    fireEvent.click(drawer);
    expect(toggleDrawer).toHaveBeenCalledWith(false);
  });

  test("When click on US tab should change to respective UI changes for placeholder and website Url", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={true} toggleDrawer={toggleDrawer}></Home>);
    let radioBtn = screen.queryByTestId("us");
    fireEvent.click(radioBtn);
    expect(
      screen.getByText("https://www.yellowpages.com/")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("search local business in us")
    ).toBeInTheDocument();
  });
  test("When click on google maps tab should change to respective UI changes for placeholder and website Url", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={true} toggleDrawer={toggleDrawer}></Home>);
    let radioBtn = screen.queryByTestId("google maps");
    fireEvent.click(radioBtn);
    expect(screen.getByText("https://www.google.com/maps")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("search local business from google maps")
    ).toBeInTheDocument();
  });

  test("When click on search without searchkeyword and location it should not call API and should not open loader", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={false} toggleDrawer={toggleDrawer}></Home>);
    axios.post.mockResolvedValueOnce({ data: {} });
    let search = screen.getByTestId("search");
    fireEvent.click(search);
    expect(axios.post).not.toHaveBeenCalled();
    const backdrop = screen.getByTestId("backdrop");
    expect(backdrop).not.toBeVisible();
  });

  test("Check for search keyword and location clear on click on cancel icon in location input", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={false} toggleDrawer={toggleDrawer}></Home>);
    fireEvent.change(
      screen.getByPlaceholderText("search local business in us"),
      { target: { value: "keyword" } }
    );
    fireEvent.change(screen.getByPlaceholderText("search for location"), {
      target: { value: "location" },
    });
    let clear = screen.getByTestId("clear");
    fireEvent.click(clear);
    expect(
      screen.getByPlaceholderText("search local business in us").value
    ).toBe("");
    expect(screen.getByPlaceholderText("search for location").value).toBe("");
  });

  test("Check for search keyword and location value same as entered", () => {
    const toggleDrawer = jest.fn();
    render(<Home open={false} toggleDrawer={toggleDrawer}></Home>);
    fireEvent.change(
      screen.getByPlaceholderText("search local business in us"),
      { target: { value: "keyword" } }
    );
    fireEvent.change(screen.getByPlaceholderText("search for location"), {
      target: { value: "location" },
    });

    expect(
      screen.getByPlaceholderText("search local business in us").value
    ).toBe("keyword");
    expect(screen.getByPlaceholderText("search for location").value).toBe(
      "location"
    );
  });

  test("check for history on click on history icon should show history on response from api", async () => {
    const toggleDrawer = jest.fn();

    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: "65fd5a6dcb11d99e336d4e65",
            searchId: "65fd5a6dcb11d99e336d4e2f",
            keyword: "car dealers",
            location: "bangalore",
            limit: 25,
            websiteType: "googlemaps",
            __v: 0,
          },
          {
            _id: "65fd624a205715506d0894c0",
            searchId: "65fd624a205715506d0894a8",
            keyword: "bike dealers",
            location: "bangalore",
            limit: 10,
            websiteType: "googlemaps",
            __v: 0,
          },
        ],
      },
    });
    render(<Home open={true} toggleDrawer={toggleDrawer}></Home>);

    await waitFor(() => {
      expect(screen.getByText("car dealers-bangalore")).toBeInTheDocument();
    });
  });

  test("check for history on click on history icon should show No history on empty response from api", () => {
    const toggleDrawer = jest.fn();
    axios.get.mockResolvedValue({
      data: {
        data: [],
      },
    });
    render(<Home open={true} toggleDrawer={toggleDrawer}></Home>);
    expect(screen.getByText("No History")).toBeInTheDocument();
  });

  test("Check for click on link in history should render searchKeyword and location and tableData", async () => {
    const toggleDrawer = jest.fn();

    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: "65fd5a6dcb11d99e336d4e65",
            searchId: "65fd5a6dcb11d99e336d4e2f",
            keyword: "car dealers",
            location: "bangalore",
            limit: 25,
            websiteType: "googlemaps",
            __v: 0,
          },
          {
            _id: "65fd624a205715506d0894c0",
            searchId: "65fd624a205715506d0894a8",
            keyword: "bike dealers",
            location: "bangalore",
            limit: 10,
            websiteType: "googlemaps",
            __v: 0,
          },
        ],
      },
    });
    render(<Home open={true} toggleDrawer={toggleDrawer}></Home>);

    await waitFor(() => {
      expect(screen.getByText("car dealers-bangalore")).toBeInTheDocument();
    });
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: "66029c0309197045891d377a",
            websiteUrl: "https://www.yellowpages.com/",
            searchParams: {
              keyWord: "real estate",
              location: "California, MD",
              _id: "66029c0309197045891d377b",
            },
            date: "2024-03-28T00:00:00.000Z",
            websiteType: "newus",
            searchResults: [
              {
                title: "O'Brien Realty",
                businessContact: "(301) 863-2400",
                email: "steve@smdhom.com",
                website: "http://www.obrienrealty.com",
                _id: "6604f471c39d84cf9eb5f23d",
              },
            ],
          },
        ],
      },
    });
    let list = screen.getAllByTestId("list");
    fireEvent.click(list[0]);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("search local business in us").value
      ).toBe("real estate");
    });
    expect(screen.getByPlaceholderText("search for location").value).toBe(
      "California, MD"
    );
    expect(
      screen.getByText("https://www.yellowpages.com/")
    ).toBeInTheDocument();
    expect(screen.getByText("2024-03-28")).toBeInTheDocument();
    expect(screen.getByText("O'Brien Realty")).toBeInTheDocument();
    expect(screen.getByText("steve@smdhom.com")).toBeInTheDocument();
    expect(screen.getByText("http://www.obrienrealty.com")).toBeInTheDocument();
  });
});
