// background.js

let extractedData = [];
let tabId;

chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      chrome.scripting.executeScript({
        files: cs.js,
        target: { tabId: tab.id, allFrames: cs.all_frames },
        injectImmediately: cs.run_at === "document_start",
        // world: cs.world, // uncomment if you use it in manifest.json in Chrome 111+
      });
    }
  }
});
chrome.action.onClicked.addListener((tab) => {
  console.log(tab)
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  tabId = activeInfo.tabId;
  chrome.tabs.sendMessage(activeInfo.tabId, { action: "tabChanged" });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // if (changeInfo.status === "complete") {
  //   chrome.tabs.sendMessage(tabId, { action: "tabUpdated" });
  // }
  if (changeInfo.status === 'complete' && tab.url === urls[currentIndex - 1]) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    chrome.tabs.sendMessage(tabId, { action: "tabUpdated" });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request)
  if (request === "getData") {
    sendResponse(extractedData);
  } else if (request.action === "startDownload") {
    chrome.tabs.sendMessage(tabId, {
      action: "startDownload",
      data: request.jsonData,
    });
  } else if (request.action === "updateData") {
    extractedData = request.data;
    chrome.runtime.sendMessage({ action: "updateData", data: extractedData });
  } else if (request.action === "saveData") {
    chrome.runtime.sendMessage({ action: "saveData"});
  }
});

function setToChromeStorage(status) {
  chrome.storage.local.set({ downloadStatus: status }, function () {});
}

chrome.action.onClicked.addListener((tab) => {
  tabId=tab.id
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: startProcessing,
    args: [/* Array of search keywords */]
  });
});


// google maps


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

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url === urls[currentIndex - 1]) {
//     chrome.scripting.executeScript({
//       target: { tabId: tabId },
//       files: ['content.js']
//     });
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    currentIndex = 0;
    createOrUpdateTab();
    chrome.runtime.sendMessage({ action: "startSearch", keyWord:request.keyWord});
  } else if (request.action === "fetchDOM") {
    console.log(`DOM from ${request.url}:`, request.dom);
    createOrUpdateTab();
  }
});
