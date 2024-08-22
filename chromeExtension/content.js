// content.js

let scrollTimer;
let prevData = [];
let currentTabId = null;
let lastScrollTop = 0;
// Function to extract emails from a string
function extractEmails(text) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(regex);
}

let isScrolling = false;
let scrollInterval;
let scrolledToBottom = false;

function startScrolling() {
  console.log("lowerStared");
  if (!isScrolling) {
    isScrolling = true;
    scrollInterval = setInterval(() => {
      window.scrollBy(0, 10); // Adjust the scroll speed here
      checkMoreResultsButton(); // Check for "More results" button during scrolling
    }, 20); // Adjust the scroll interval here
  }
}

async function stopScrolling() {
  console.log(isScrolling);
  if (isScrolling) {
    isScrolling = false;

    clearInterval(scrollInterval);
    await chrome.storage.local.set(
      { extractionStatus: "stopped" },
      function () {}
    );
  }
}

function scrollToBottom() {
  if (!isScrolling) {
    isScrolling = true;
    scrollInterval = setInterval(() => {
      let scrollHeight = document.documentElement.scrollHeight;
      let scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      let clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight) {
        console.log("higher");
        (async () => await stopScrolling())();
        scrolledToBottom = true;
        checkMoreResultsButton();
      } else {
        window.scrollBy(0, 10); // Adjust the scroll speed here
        console.log("lower");
        scrolledToBottom = false;
        checkMoreResultsButton();
      }
    }, 20); // Adjust the scroll interval here
  }
}

function checkMoreResultsButton() {
  if (scrolledToBottom) {
    let moreResultsButton = document.querySelector(
      "[aria-label='More results']"
    );
    let stopMore = document.querySelector("#ofr");
    if (stopMore) {
      console.log("stopMore");
      (async () => await stopScrolling())(); // Stop scrolling if no more "More results" button
      scrolledToBottom = false;
      chrome.runtime.sendMessage({ action: "saveData" });
      chrome.storage.local.get(["searchKeywords"], function (result) {
        console.log(result);
        if(result.searchKeywords.length>0){
          let keyWords=result.searchKeywords;
          if(keyWords[0]){
            setSearchKeywords(keyWords[0]);
            keyWords.shift();
            chrome.storage.local.set({ searchKeywords: keyWords }, function () {});
          }
        }

      });
    // Reset the flag to prevent repeated calls
    } else if (moreResultsButton) {
      console.log("MoreClick");
      moreResultsButton.click();
      startScrolling(); // Resume scrolling after clicking "More results"
    }
  }
}

function userStoppedScrolling() {
  (async () => await stopScrolling())();
}

document.addEventListener("wheel", userStoppedScrolling, { passive: true });
document.addEventListener("touchmove", userStoppedScrolling, { passive: true });

function getData() {
  let contentArray = document.querySelectorAll(".MjjYud");
  let output = [];

  for (let i = 0; i < contentArray.length; i++) {
    let email = extractEmails(contentArray[i].innerText);
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

    let data = {};
    if (email && !output.find((el) => el.email === email[0])) {
      let emailValidation = regex.test(email[0]);
      // if(emailValidation){
      let title = contentArray[i].querySelector("h3");
      let website = contentArray[i].querySelector("[jsname='UWckNb']");
      let name = contentArray[i].querySelector(".VuuXrf");
      data.email = email[0];
      if (website) {
        data.website = website.getAttribute("href");
      }
      if (name.innerText) {
        data.name = name.innerText;
      }
      output.push(data);
    }
    // }
  }

  return output;
}

// Throttle function to limit the number of events that take place in a given amount of time
function throttle(callback, delay) {
  let previousCall = new Date().getTime();
  return function () {
    const time = new Date().getTime();

    if (time - previousCall >= delay) {
      previousCall = time;
      callback.apply(null, arguments);
    }
  };
}

// Function to handle scroll event
function handleScroll() {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(function () {
    loadData();
  }, 500); // Adjust delay as needed
}

function loadData() {
  const data = getData();
  // if (data.length > 0 && data.length>prevData.length ) {
  chrome.runtime.sendMessage({ action: "updateData", data });
  // }
  prevData = data;
}

async function JSONToXLS(jsonData) {
  const formData = new FormData();
  formData.append("list", JSON.stringify(jsonData));
  formData.append("type", "list");
  const xlsContent = [];
  try {
    const response = await fetch(`http://localhost:8000/validateEmails`, {
      method: "POST",
      body: formData,
    });
    console.log(response);
    const data = await response.json();
    console.log(data);
    if (!response.ok) {
      throw new Error(data.message);
    } else {
      const header = ["email", "name", "website"].join("\t");
      xlsContent.push(header);
      // jsonData = data;
      data.forEach((item) => {
        const row = [item.email, item.name, item.website].join("\t");
        xlsContent.push(row);
      });
      return xlsContent.join("\n");
    }
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
}

function setToChromeStorage() {
  chrome.storage.local.set({ downloadStatus: "Download" }, function () {});
}

function setSearchKeywords(keyWord) {
  let textArea = document.querySelector('textarea[aria-label="Search"]');
  if (!textArea) {
    textArea = document.querySelector("#input");
  }
  console.log(textArea, "=====>area");

  textArea.value = keyWord;
  let inputEvent = new Event("input", { bubbles: true, cancelable: true });
  textArea.dispatchEvent(inputEvent);
  let searchForm = textArea.closest("form");
  if (searchForm) {
    searchForm.submit();
    isScrolling = true;
    chrome.storage.local.set({ extractionStatus: "started" }, function () {});
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log(request, "request==============>");
  if (request.action === "tabChanged") {
    // Call loadData() when a tab change is detected
    loadData();
    // scrollToBottom()
  } else if (request.action === "tabUpdated") {
    loadData();
    chrome.storage.local.get(["extractionStatus"], function (result) {
      console.log(result);
      if (result.extractionStatus === "started") {
        // createOrUpdateTab();
        scrollToBottom();
      } else if (result.extractionStatus === "stopped") {
        (async () => await stopScrolling())();
      }
    });
  }
  if (request.action === "startSearch") {
    // scrollToBottom()
    // createOrUpdateTab();
    let keyword = request.keyWord;
    console.log(keyword);
    setSearchKeywords(keyword);

  } else if (request.action === "stop") {
    (async () => await stopScrolling())();
  }
  if (request.action === "startDownload") {
    console.log("clled from content");
    console.log("download complete received");
    // chrome.runtime.sendMessage({ action: 'getDataFromStorage' },async function(response) {

    const xlsContent = await JSONToXLS(request.data);
    if (xlsContent?.error) {
      alert(xlsContent.message);
      setToChromeStorage();
      chrome.runtime.sendMessage({ action: "downloadComplete" });
      return;
    }
    console.log(xlsContent);
    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.xlsx";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setToChromeStorage();
    chrome.runtime.sendMessage({ action: "downloadComplete" });
    // })
  }
});
// Listen for scroll event
window.addEventListener("scroll", throttle(handleScroll, 1000)); // Adjust throttle delay as needed

// google maps

// Fetch the DOM of the current page
// const dom = document.documentElement.outerHTML;

// // Send the DOM back to the background script
// chrome.runtime.sendMessage({
//   action: "fetchDOM",
//   url: window.location.href,
//   dom: dom
// });
const urls = [
  "https://www.google.com/",
  "https://www.google.co.in/maps",
  // Add more URLs here
];
let currentIndex = 0;

function createOrUpdateTab() {
  if (currentIndex >= urls.length) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab) {
      chrome.tabs.update(activeTab.id, { url: urls[currentIndex] }, () => {
        currentIndex++;
      });
    } else {
      chrome.tabs.create({ url: urls[currentIndex] }, () => {
        currentIndex++;
      });
    }
  });
}