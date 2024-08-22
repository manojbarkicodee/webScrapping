import {
  Backdrop,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  styled,
  tableCellClasses,
} from "@mui/material";
import React from "react";
// import Dialog from '@mui/material/Dialog';
// import DialogActions from '@mui/material/DialogActions';
// import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText';
// import DialogTitle from '@mui/material/DialogTitle';
// import Button from '@mui/material/Button';
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import ReplayIcon from "@mui/icons-material/Replay";
import axios from "axios";
import SourceIcon from "@mui/icons-material/Source";
import styles from "./Jobs.module.css";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import { useNavigate } from "react-router-dom";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import AlertPopUp from "../alertPopUp/AlertPopUp";
import DeleteIcon from "@mui/icons-material/Delete";
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#FF6F61",
    color: theme.palette.common.white,
    maxWidth: "10vw",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  " &:last-child th": {
    border: 0,
  },
}));

const Jobs = ({ tableData, setTableData, setBackDropOpen }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [currentJobId, setCurrentJobId] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertData, setAlertData] = useState({
    severity: "",
    message: "",
  });
  const handleClickOpen = () => {
    setOpen(true);
  };

  let tableDataKeys = [
    "jobId",
    "name",
    "searchKeyword",
    "location",
    "createdAt",
    "updatedAt",
    "jobStatus",
    "schedular.name",
    "actions",
  ];
  const handleBackDropClose = () => {
    setBackDropOpen(false);
  };

  const handleBackDropOpen = () => {
    setBackDropOpen(true);
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
  const getJobs = async () => {
    try {
      let response = await axios.get(`${process.env.REACT_APP_API_URL}/jobs`);
      setTableData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    (async () => {
      await getJobs();
    })();
  }, []);

  let tableHeaders = [
    {
      title: "JobId",
    },
    {
      title: "Name",
    },
    {
      title: "Search keyword",
    },
    {
      title: "Location",
    },
    {
      title: "Created At",
    },
    {
      title: "Ended At",
    },
    {
      title: "Status",
    },
    {
      title: "Schedular",
    },
    {
      title: "Actions",
    },
  ];
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);

    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = date.toLocaleDateString(undefined, options);

    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return `${formattedDate} ${formattedTime}`;
  };

  let navigateToDocuments = (jobRefId) => {
    navigate(jobRefId, { relative: "path" });
  };

  let downloadContacts = (id) => {
    setCurrentJobId(id);
    handleClickOpen();
  };

  const requestToStart = async (jobId, jobStatus) => {
    let status = "Paused";
    if (jobStatus === "Queued") {
      status = "Requested";
    } else if (jobStatus === "Suspended") {
      status = "Restart";
    } else if (jobStatus === "Paused") {
      status = "Resume";
    }
    try {
      handleBackDropOpen();
      let response = await axios.post(
        `${process.env.REACT_APP_API_URL}/scrap/statusUpdate/${jobId}`,
        {
          jobStatus: status,
        }
      );

      setAlertData({ severity: "success", message: response.data.message });
      await getJobs();
      handleBackDropClose();
      setTimeout(() => {
        setAlertData({ severity: "", message: "" });
      }, 3000);
    } catch (error) {
      console.log(error.response);
      handleBackDropClose();
      let message = "Interal server error,try after sometime";
      if (error.message === "Request failed with status code 404") {
      } else if (error.response.data?.message) {
        message = error.response.data?.message;
      }
      setAlertData({ severity: "error", message: message });
      setTimeout(() => {
        setAlertData({ severity: "", message: "" });
      }, 3000);
    }
  };
  const [deleteConfirmopen, setDeleteConfirmopen] = useState(false);
  const handleOpen = (jobId) => {
    setDeleteConfirmopen(true);
    setCurrentJobId(jobId);
  };
  const handleDelete = async () => {
    try {
      handleBackDropOpen();
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/deleteJob/${currentJobId}`
      );
      setAlertData({ severity: "success", message: response.data.message });
      await getJobs();
      handleBackDropClose();
      setTimeout(() => {
        setAlertData({ severity: "", message: "" });
      }, 3000);
    } catch (error) {
      let message = "Interal server error,try after sometime";
      if (error.message === "Request failed with status code 404") {
      } else if (error.response.data?.message) {
        message = error.response.data?.message;
      }
      setAlertData({ severity: "error", message: message });
      setTimeout(() => {
        setAlertData({ severity: "", message: "" });
      }, 3000);
    }
    // Perform the delete action here
    console.log("Item deleted");
    setDeleteConfirmopen(false);
  };

  const handleClose = () => {
    setDeleteConfirmopen(false);
  };

  return (
    <div>
      <FormDialog
        open={open}
        setOpen={setOpen}
        jobId={currentJobId}
      ></FormDialog>
      <AlertPopUp
        severity={alertData.severity}
        message={alertData.message}
        alertOpen={alertOpen}
        handleClose={handleAlertClose}
      ></AlertPopUp>
      <DeleteConfirmationDialog
        open={deleteConfirmopen}
        handleClose={handleClose}
        handleDelete={handleDelete}
      />
      <TableContainer component={Paper} data-testid="customtable">
        <Table className={styles.tableCont} aria-label="customized table">
          <TableHead className={styles.headerRow}>
            <TableRow>
              {tableHeaders.map((header) => (
                <StyledTableCell sx={{ fontSize: "17px" }} align="center">
                  {header.title}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.length > 0 &&
              (rowsPerPage > 0
                ? tableData.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                  )
                : tableData
              ).map((row, i) => (
                <StyledTableRow key={i} className={styles.tableBodyRow}>
                  {tableDataKeys.map((key, i) => {
                    return (
                      <StyledTableCell
                        key={i}
                        align="center"
                        className={`${key === "actions" && styles.actionsTd} ${
                          styles.td
                        }`}
                      >
                        <label htmlFor="">{tableHeaders[i].title} : </label>
                        {key === "actions" ? (
                          <div style={{ display: "flex" }}>
                            {row.jobStatus !== "Resume" &&
                            row.jobStatus !== "Suspended" &&
                            row.jobStatus !== "Queued" ? (
                              <Button
                                disabled={
                                  (row.jobStatus === "Completed" &&
                                    row.scheduler.name === "Scrape emails") ||
                                  row.jobStatus === "Verified" ||
                                  row.jobStatus === "Failed" ||
                                  row.jobStatus === "No Emails"
                                }
                                onClick={() =>
                                  requestToStart(row._id, row.jobStatus)
                                }
                                sx={{ minWidth: "45px" }}
                              >
                                <Tooltip
                                  placement="top"
                                  arrow
                                  title={
                                    row.jobStatus === "Paused"
                                      ? "Resume"
                                      : "Pause"
                                  }
                                >
                                  {row.jobStatus === "Paused" ? (
                                    <ReplayIcon></ReplayIcon>
                                  ) : (
                                    <PauseIcon></PauseIcon>
                                  )}
                                </Tooltip>
                              </Button>
                            ) : (
                              <Button
                                disabled={
                                  row.jobStatus === "Suspended" ||
                                  row.jobStatus === "Queued"
                                    ? false
                                    : true || row.jobStatus !== "Queued"
                                }
                                onClick={() =>
                                  requestToStart(row._id, row.jobStatus)
                                }
                                sx={{ minWidth: "45px" }}
                              >
                                <Tooltip
                                  placement="top"
                                  arrow
                                  title={
                                    row.jobStatus === "Queued"
                                      ? "Start"
                                      : row.jobStatus === "Suspended"
                                      ? "Restart"
                                      : "Pause"
                                  }
                                >
                                  <PlayArrowIcon></PlayArrowIcon>
                                </Tooltip>
                              </Button>
                            )}

                            <Button
                              disabled={
                                row.jobStatus !== "Verified" &&
                                row.scheduler.name !== "Validate emails"
                              }
                              onClick={() => navigateToDocuments(row._id)}
                              sx={{ minWidth: "45px" }}
                            >
                              <Tooltip
                                placement="top"
                                arrow
                                title={"View Contacts"}
                              >
                                <SourceIcon></SourceIcon>
                              </Tooltip>
                            </Button>
                            <Button
                              disabled={
                                row.jobStatus !== "Verified" &&
                                row.scheduler.name !== "Validate emails"
                              }
                              onClick={() => downloadContacts(row._id)}
                              sx={{ minWidth: "45px" }}
                            >
                              <Tooltip
                                placement="top"
                                arrow
                                title={"Export Contacts"}
                              >
                                <FileDownloadIcon></FileDownloadIcon>
                              </Tooltip>
                            </Button>
                            <Button
                              disabled={
                                row.jobStatus !== "Verified" &&
                                row.jobStatus !== "Failed" &&
                                row.jobStatus !== "No Emails" &&
                                row.jobStatus !== "Paused" &&
                                row.jobStatus !== "Queued"
                                // row.scheduler.name !== "Validate emails"
                              }
                              color="error"
                              sx={{ minWidth: "45px" }}
                              onClick={() => handleOpen(row._id)}
                            >
                              <Tooltip
                                placement="top"
                                arrow
                                title={"Delete job"}
                              >
                                <DeleteIcon></DeleteIcon>
                              </Tooltip>
                            </Button>
                          </div>
                        ) : (
                          <Tooltip
                            placement="top"
                            arrow
                            title={
                              row[key] !== "N/A"
                                ? key === "createdAt" || key === "updatedAt"
                                  ? formatDate(row[key])
                                  : key === "schedular.name"
                                  ? row.scheduler.name
                                  : row[key]
                                : ""
                            }
                          >
                            <p>
                              {key === "createdAt" || key === "updatedAt"
                                ? formatDate(row[key])
                                : key === "schedular.name"
                                ? row.scheduler.name
                                : row[key]}
                            </p>
                          </Tooltip>
                        )}
                      </StyledTableCell>
                    );
                  })}
                </StyledTableRow>
              ))}
            {tableData.length === 0 && (
              <StyledTableRow data-testid="noResults">
                <StyledTableCell align="center"></StyledTableCell>
                <StyledTableCell align="center"></StyledTableCell>
                <StyledTableCell align="center"></StyledTableCell>{" "}
                <StyledTableCell align="center">No Contacts</StyledTableCell>
                <StyledTableCell align="center"></StyledTableCell>
                <StyledTableCell align="center"></StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
              colSpan={3}
              count={tableData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              slotProps={{
                select: {
                  inputProps: {
                    "aria-label": "rows per page",
                  },
                  native: true,
                },
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </TableContainer>
    </div>
  );
};

export default Jobs;

const DeleteConfirmationDialog = ({
  open,
  handleClose,
  handleDelete,
  jobRefId,
  setDeleteConfirmopen,
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{"Delete Confirmation"}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Are you sure you want to delete this item? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleDelete} color="primary" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function FormDialog({ open, setOpen, jobId }) {
  const [downloadData, setDownloadData] = useState([]);

  const handleClose = () => {
    setOpen(false);
  };

  const getDownloadContacts = async () => {
    try {
      let response = await axios.get(
        `${process.env.REACT_APP_API_URL}/contacts/${jobId}?email=true&status=valid`
      );
      let filterKeys = ["title", "websiteUrl", "phoneNumber", "email"];
      const filteredData = response.data.map((item) => {
        return filterKeys.reduce((obj, key) => {
          if (item[key]) obj[key] = item[key];
          return obj;
        }, {});
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
          onSubmit: (event) => {
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
