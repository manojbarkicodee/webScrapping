// popup.js

document.addEventListener("DOMContentLoaded", function () {
  function googleSearch() {
    const dataTable = document.getElementById("data-body");
    const downloadBtn = document.getElementById("download-btn");
    const saveList = document.querySelector("#save-btn");
    const clearList = document.querySelector("#clear-btn");
    const count = document.querySelector("#count");
    getFromChromeStorage();
    let extractedData = [];
    let data = localStorage.getItem("emails");
    if (data) {
      dataTable.innerHTML = "";
      visibleClearBtn(data);
      setTableData(JSON.parse(data));
      extractedData = JSON.parse(data);
    }

    function visibleClearBtn(list) {
      if (list.length > 0) {
        clearList.style.display = "inline";
      } else {
        clearList.style.display = "none";
      }
    }

    async function JSONToCSV(jsonArray) {
      const csvRows = [];
      const headers = Object.keys(jsonArray[0]);
      csvRows.push(headers.join("\t"));

      for (const row of jsonArray) {
        const values = headers.map((header) => {
          const escaped = ("" + row[header]).replace(/"/g, '\\"');
          return `${escaped}`;
        });
        csvRows.push(values.join("\t"));
      }

      return csvRows.join("\n");
    }

    function downloadCSV(content) {
      const csvContent = JSONToCSV(content);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "extracted_data.csv";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    // Example usage

    // Function to download XLS file
    async function downloadXLS(content) {
      if (content.length > 0) {
        alert("Click 'OK' to start download and wait for some time..");
        setToChromeStorage("Downloading..");

        chrome.runtime.sendMessage({
          action: "startDownload",
          jsonData: content,
        });
        getFromChromeStorage();
        console.log("download started...");
      } else {
        alert("No emails found to download..");
      }
    }

    function setToChromeStorage(status) {
      chrome.storage.local.set({ downloadStatus: status }, function () {});
    }

    function getFromChromeStorage() {
      chrome.storage.local.get(["downloadStatus"], function (result) {
        if (result.downloadStatus) {
          downloadBtn.textContent = result.downloadStatus;
          result.downloadStatus === "Downloading.."
            ? ((downloadBtn.disabled = true),
              (downloadBtn.style.opacity = "0.5"))
            : ((downloadBtn.disabled = false),
              (downloadBtn.style.opacity = "10"));
        } else {
          downloadBtn.textContent = "Dowload";
          downloadBtn.style.opacity = "10";
        }
      });
    }

    function saveToLocalstorage() {
      localStorage.setItem(
        "emails",
        JSON.stringify(extractedData),
        function () {}
      );
      if (extractedData.length > 0) {
        // alert("Click 'OK' to save the list");
        data = localStorage.getItem("emails");
        dataTable.innerHTML = "";
        setTableData(extractedData);
        visibleClearBtn(extractedData);
      } else {
        alert("No emails found to save..");
      }
    }

    function clearLocalStorage() {
      alert("Click 'OK' to clear the saved list");
      data = localStorage.getItem("emails");
      if (data) {
        // extractedData = extractedData.filter((el) => {
        //   let newdata = JSON.parse(data);
        //   let emails = newdata.map((el) => el.email);
        //   return !emails.includes(el.email);
        // });
        dataTable.innerHTML = "";
        localStorage.removeItem("emails");
        data = localStorage.getItem("emails");
        console.log(data);
        setTableData(extractedData);
      }

      visibleClearBtn([]);
    }

    function setTableData(response) {
      let savedEmails;
      count.textContent = `(${response.length})`;
      if (data) {
        let newdata = JSON.parse(data);
        savedEmails = newdata.map((el) => el.email);
      }
      response.forEach((item) => {
        const row = document.createElement("tr");
        const emailCell = document.createElement("td");
        emailCell.textContent = item.email;
        const titleCell = document.createElement("td");
        titleCell.textContent = item.name;
        const websiteCell = document.createElement("td");
        const websiteAnchor = document.createElement("a");
        websiteAnchor.href = item.website;
        websiteAnchor.target = "_blank";
        websiteAnchor.textContent = item.website;
        websiteCell.append(websiteAnchor);
        row.appendChild(emailCell);
        row.appendChild(titleCell);
        row.appendChild(websiteCell);
        if (savedEmails && savedEmails.includes(item.email)) {
          emailCell.style.backgroundColor = "yellow";
          titleCell.style.backgroundColor = "yellow";
          websiteCell.style.backgroundColor = "yellow";
        }
        dataTable.appendChild(row);
      });
    }
    // Message background script to get data
    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      if (request.action === "downloadComplete") {
        downloadBtn.textContent = "Download";
        downloadBtn.disabled = false;
        downloadBtn.style.opacity = "10";
      } else if (request.action === "updateData") {
        updateTable(request.data);
      } else if (request.action === "saveData") {
        saveToLocalstorage();
      }
    });

    chrome.runtime.sendMessage("getData", function (response) {
      updateTable(response);
    });

    function updateTable(response) {
      let data = localStorage.getItem("emails");
      if (data) {
        response = [...response, ...JSON.parse(data)];
      }
      const emailSet = new Set();

      // Step 2: Filter the array to include only objects with unique emails
      const uniqueEmailObjects = response.filter((item) => {
        if (emailSet.has(item.email)) {
          return false; // Email already encountered, skip this item
        } else {
          emailSet.add(item.email); // Add new email to the set
          return true; // Include this item in the result
        }
      });
      dataTable.innerHTML = "";
      setTableData(uniqueEmailObjects);

      extractedData = uniqueEmailObjects;
    }
    // Add click event listener to download button
    downloadBtn.addEventListener("click", function () {
      downloadXLS(extractedData);
    });

    saveList.addEventListener("click", function () {
      saveToLocalstorage();
    });

    clearList.addEventListener("click", function () {
      clearLocalStorage();
    });
    // scroll===================
    document.getElementById("start").addEventListener("click", () => {
      let keywords = document.getElementById("keywordsInput").value;
      keywords = keywords.split("\n");
      console.log(keywords);
      let keyWord = keywords.shift();
      chrome.storage.local.set({ searchKeywords: keywords }, function () {});
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "start", keyWord });
      });
    });

    document.getElementById("stop").addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "stop" });
      });
    });

    // ==============================
    // document.getElementById('start').addEventListener('click', () => {
    //   let url = document.getElementById('urlInput').value;

    //   console.log(keywords)
    //   // .split("/n").map(keyword => keyword.trim());

    //   if (url && keywords.length > 0) {
    //     chrome.tabs.create({ url: url }, (tab) => {
    //       setTimeout(()=>{
    //         chrome.tabs.sendMessage(tab.id, { action: "startProcessing", keywords: keywords });
    //       },3000)

    //     });
    //   }
    // });
  }
  googleSearch();
  // googleMapsSearch();
});

function googleMapsSearch() {
  document.getElementById("startFetching").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startFetching" });
  });
  
}
