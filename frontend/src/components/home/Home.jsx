import React, { useContext, useEffect, useState } from "react";
import MailIcon from "@mui/icons-material/Mail";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Backdrop,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  styled,
  TextField,
} from "@mui/material";
import * as XLSX from "xlsx";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Tooltip from "@mui/material/Tooltip";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";

import styles from "./Home.module.css";

import CreateJobModal from "../createJobModal/CreateJobModal";
import Jobs from "../jobs/Jobs";
import { useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import AlertPopUp from "../alertPopUp/AlertPopUp";
import { NotificationContext } from "../noticationContext/notificationContext";
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});
const Home = () => {
  let { toggleDrawer, setHasUnread, hasUnread } =
    useContext(NotificationContext);
  const [tableData, setTableData] = useState([]);
  const navigate = useNavigate();
  const [backDropOpen, setBackDropOpen] = useState(false);
  const [validationJob, setValidationJob] = useState([]);
  const [openModal, setopenModal] = useState(false);
  const [currentJobId, setCurrentJobId] = useState("");
  const [openDownload, setOpenDownload] = useState(false);
  const [alertData, setAlertData] = useState({
    severity: "",
    message: "",
  });
  const [alertOpen, setAlertOpen] = useState(false);
  const handleClickOpen = () => {
    setopenModal(true);
  };
  const [selectedFile, setSelectedFile] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const handleBackDropClose = () => {
    setBackDropOpen(false);
  };

  const handleBackDropOpen = () => {
    setBackDropOpen(true);
  };
  const handleChange = (event, isExpanded) => {
    setExpanded(isExpanded);
    console.log(`Accordion is now ${isExpanded ? "opened" : "closed"}`);
  };
  useEffect(() => {
    if (alertData.message) {
      handleAlertOpen();
    }
  }, [alertData.message]);

  const handleAlertOpen = () => {
    setAlertOpen(true);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "file");

      try {
        handleBackDropOpen();
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/validateEmails`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        let message = "Job requested for validation";
        setAlertData({ severity: "success", message: message });
        console.log("File uploaded successfully:", response.data);
        await getValidationJobs();
        handleBackDropClose();

        // Reset the file input
        event.target.value = null;

        setTimeout(() => {
          setAlertData({ severity: "", message: "" });
        }, 3000);
      } catch (error) {
        handleBackDropClose();
        let message = "Internal server error, try again later";
        if (error.message === "Request failed with status code 404") {
          message = "No pages found for search keywords";
        } else if (error.response.data?.message) {
          message = error.response.data?.message;
        }
        setAlertData({ severity: "error", message: message });

        // Reset the file input
        event.target.value = null;

        setTimeout(() => {
          setAlertData({ severity: "", message: "" });
        }, 3000);
        console.error("Error uploading file:", error);
      }
    }
  };

  useEffect(() => {
    if (expanded) {
      (async () => {
        await getValidationJobs();
      })();
    }
  }, [expanded]);

  const getValidationJobs = async () => {
    try {
      handleBackDropOpen();
      let response = await axios.get(
        `${process.env.REACT_APP_API_URL}/validationJobs`
      );
      setValidationJob(response.data);
      handleBackDropClose();
    } catch (error) {
      handleBackDropClose();
      let message = "Interal server error,try after sometime";
      if (error.message === "Request failed with status code 404") {
        message = "No pages found for search keywords";
      } else if (error.response.data?.message) {
        message = error.response.data?.message;
      }
      setAlertData({ severity: "error", message: message });
      setTimeout(() => {
        setAlertData({ severity: "", message: "" });
      }, 3000);
      console.error("Error uploading file:", error);
    }
  };

  let downloadContacts = (id) => {
    setCurrentJobId(id);
    setOpenDownload(true);
  };

  return (
    <Box data-testid="home">
      <CreateJobModal
        open={openModal}
        setOpen={setopenModal}
        tableData={tableData}
        setTableData={setTableData}
        setBackDropOpen={setBackDropOpen}
      ></CreateJobModal>
      <FormDialog
        open={openDownload}
        setOpen={setOpenDownload}
        jobId={currentJobId}
        setExpanded={setExpanded}
      ></FormDialog>
      <AlertPopUp
        severity={alertData.severity}
        message={alertData.message}
        alertOpen={alertOpen}
        handleClose={handleAlertClose}
      ></AlertPopUp>
      <Backdrop
        sx={{
          color: "#fff",
          backdropFilter: "blur(5px)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        data-testid="backdrop"
        open={backDropOpen}
      >
        {/* <CircularProgress thickness={4} /> */}
        <div className={styles.loaderCont}>
          <div className={styles.loader}></div>
          <p>Processing your request...</p>
        </div>
      </Backdrop>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "20px",
          // position:"relative"
        }}
      >
        <Button
          sx={{ right: "0px!important" }}
          variant="outlined"
          onClick={handleClickOpen}
        >
          + Create Job
        </Button>
        <Button
          component="label"
          role={undefined}
          variant="outlined"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          sx={{ marginRight: "30px" }}
          label={"*Only csv files"}
        >
          Upload file
          <VisuallyHiddenInput onChange={handleFileChange} type="file" />
        </Button>
        <Accordion
          sx={{
            position: "absolute",
            width: "30px",
            minHeight: "36px",
            maxHeight: "36px",
          }}
          expanded={expanded}
          onChange={handleChange}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ margin: "0px!important" }} />}
            aria-controls="panel1-content"
            id="panel1-header"
            sx={{ minHeight: "38px!important", maxHeight: "38px" }}
          ></AccordionSummary>
          <Paper>
            <AccordionDetails
              sx={{
                position: "absolute",
                right: "0px",
                background: "white",
                width: "346px",
                zIndex: "500",
                paddingLeft: "0px!important",
                paddingRight: "0px!important",
                border: "1px solid #00000024",
                // borderTop: "none",
                borderRadius: "0px 0px 5px 5px ",
              }}
            >
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  bgcolor: "background.paper",
                  overflowY: "auto",
                  maxHeight: "300px",
                }}
              >
                {validationJob.map((job) => {
                  return (
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            backgroundColor:
                              job.status === "Completed"
                                ? "#74e374"
                                : job.status === "Failed" && "#f75151c2",
                          }}
                        >
                          <MailIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={job.name}
                        secondary={new Date(job.completedIn).toLocaleString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            second: "numeric",
                            hour12: true, // to ensure the time is in 12-hour format with AM/PM
                          }
                        )}
                      />
                      <Button
                        disabled={job.status !== "Completed"}
                        onClick={() => downloadContacts(job._id)}
                      >
                        <Tooltip
                          placement="top"
                          arrow
                          title={"Export Contacts"}
                        >
                          <FileDownloadIcon></FileDownloadIcon>
                        </Tooltip>
                      </Button>
                    </ListItem>
                  );
                })}

                {!backDropOpen && validationJob.length === 0 && (
                  <p style={{ margin: "0px" }}>No files uploaded yet.</p>
                )}
              </List>
            </AccordionDetails>
          </Paper>
        </Accordion>
      </Box>

      <Box
        sx={{
          marginTop: "50px",
          boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
          padding: "20px 10px",
        }}
      >
        <Box className={styles.websiteUrl} sx={{}}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <label>
              <h3>Website : </h3>
            </label>
            <a
              href={"https://www.yellowpages.com/"}
              target="_blank"
              rel="noreferrer"
            >
              {"https://www.yellowpages.com/"}
            </a>
          </Box>

          <Tooltip title="All Contacts" placement="top" arrow>
            <DocumentScannerIcon
              onClick={() => navigate("/contacts")}
              className={styles.downloadIcon}
            ></DocumentScannerIcon>
          </Tooltip>
        </Box>

        <Jobs
          setBackDropOpen={setBackDropOpen}
          tableData={tableData}
          setTableData={setTableData}
        ></Jobs>
      </Box>
    </Box>
  );
};

export default Home;

function FormDialog({ open, setOpen, jobId, setExpanded }) {
  const [downloadData, setDownloadData] = useState([]);

  const handleClose = () => {
    setOpen(false);
  };

  const getDownloadContacts = async () => {
    try {
      let response = await axios.get(
        `${process.env.REACT_APP_API_URL}/validContacts/${jobId}`
      );
      let filterKeys = [];
      const filteredData = response.data.map((item) => {
        delete item._id;
        delete item.jobRefId;
        delete item.__v;
        return item;
      });
      setDownloadData(filteredData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    (async () => {
      if (open) {
        await getDownloadContacts();
      }
    })();
  }, [open]);

  const deleteJob = async () => {
    try {
      let response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/deleteValidationJob/${jobId}`
      );
      setExpanded(false);
    } catch (error) {
      throw error;
    }
  };
  const downloadCSV = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const dataBlob = new Blob([csvContent], {
      type: "text/csv",
    });

    const secureBlobUrl = URL.createObjectURL(dataBlob);

    const anchorElement = document.createElement("a");
    anchorElement.href = secureBlobUrl;
    anchorElement.download = `${filename}.csv`;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
  };

  const downloadExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const columnWidths = [];
    data.forEach((row) => {
      Object.values(row).forEach((value, index) => {
        const cellLength = value ? value.toString().length : 0;
        if (!columnWidths[index] || cellLength > columnWidths[index]) {
          columnWidths[index] = cellLength;
        }
      });
    });
    worksheet["!cols"] = columnWidths.map((width) => {
      return { width: width > 40 ? 40 * 1.2 : width * 1.2 };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    const secureBlobUrl = URL.createObjectURL(dataBlob);
    const anchorElement = document.createElement("a");
    anchorElement.href = secureBlobUrl;
    anchorElement.download = `${filename}.xlsx`;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
  };
  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            const filename = formJson.filename;
            const fileformat = formJson.fileformat;
            if (fileformat === "xls") {
              downloadExcel(downloadData, filename);
            } else if (fileformat === "csv") {
              downloadCSV(downloadData, filename);
            }
            await deleteJob();
            console.log(`Filename: ${filename}, File format: ${fileformat}`);
            handleClose();
          },
        }}
      >
        <DialogTitle>Export Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To download the file, please enter the filename and select the file
            format.
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="filename"
            name="filename"
            label="Filename"
            type="text"
            fullWidth
            variant="standard"
          />
          <FormControl fullWidth margin="dense" variant="standard">
            <InputLabel id="fileformat-label">File Format</InputLabel>
            <Select
              labelId="fileformat-label"
              id="fileformat"
              name="fileformat"
              required
              defaultValue=""
            >
              <MenuItem value="xls">XLS</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Download</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
