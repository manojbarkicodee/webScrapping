import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  TextField,
  styled,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import AlertPopUp from "../alertPopUp/AlertPopUp";
const CreateJobModal = ({
  open,
  setOpen,
  tableData,
  setBackDropOpen,
  setTableData,
}) => {
  const handleBackDropClose = () => {
    setBackDropOpen(false);
  };

  const handleBackDropOpen = () => {
    setBackDropOpen(true);
  };
  const [errors, setErrors] = useState({});
  const [alertData, setAlertData] = useState({
    severity: "",
    message: "",
  });
  const [alertOpen, setAlertOpen] = useState(false);
  const [createJob, setCreateJob] = useState({
    websiteUrl: "https://www.yellowpages.com",
    searchKeyword: "",
    location: "",
    name: "",
  });
  const getJobs = async () => {
    try {
      let response = await axios.get(`${process.env.REACT_APP_API_URL}/jobs`);
      setTableData(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const websites = [
    {
      value: "https://www.yellowpages.com",
      label: "Yellow page us",
    },
  ];

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
  const handleChange = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    setCreateJob((prevJob) => ({
      ...prevJob,
      [name]: value,
    }));
  };

  const onCreateJob = async () => {
    if (validateForm()) {
      try {
        // http://localhost:3000/
        handleClose();
        handleBackDropOpen();
        let response = await axios.post(
          `${process.env.REACT_APP_API_URL}/scrap/queued`,
          createJob
        );

        let message = "Job queued successfully";
        setAlertData({ severity: "success", message: message });
        await getJobs();
        handleBackDropClose();
        setTimeout(() => {
          setAlertData({ severity: "", message: "" });
        }, 3000);
      } catch (error) {
        console.log(error);
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
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    for (let key in createJob) {
      if (!createJob[key] && key !== "lastName") {
        newErrors[key] = `${key
          .toUpperCase()
          .split("_")
          .join(" ")} is required`;
      } else {
        delete newErrors[key];
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setCreateJob({ ...createJob, searchKeyword: "", location: "", name: "" });
    setOpen(false);
  };
  return (
    <React.Fragment>
      <AlertPopUp
        severity={alertData.severity}
        message={alertData.message}
        alertOpen={alertOpen}
        handleClose={handleAlertClose}
      ></AlertPopUp>
      <Dialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
        maxWidth="lg"
        minWidth="lg"
        disableScrollLock={true}
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Create Job
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 12,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ minWidth: "500px" }}>
          <TextField
            id="outlined-select-currency"
            label="Name"
            value={createJob.name}
            error={!!errors["name"]}
            helperText={errors["name"]}
            onChange={(e) => handleChange(e)}
            fullWidth
            size="small"
            name="name"
            sx={{ marginBottom: "20px" }}
            aria-disabled={true}
          ></TextField>
          <TextField
            id="outlined-select-currency"
            select
            label="Select"
            defaultValue={createJob.websiteUrl}
            error={!!errors["websiteUrl"]}
            helperText={errors["websiteUrl"]}
            onChange={(e) => handleChange(e)}
            fullWidth
            size="small"
            name="websiteUrl"
            sx={{ marginBottom: "20px" }}
          >
            {websites.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            id="outlined-select-currency"
            label="Search keyword"
            value={createJob.searchKeyword}
            error={!!errors["searchKeyword"]}
            helperText={errors["searchKeyword"]}
            onChange={(e) => handleChange(e)}
            fullWidth
            size="small"
            name="searchKeyword"
            sx={{ marginBottom: "20px" }}
            aria-disabled={true}
          ></TextField>
          <TextField
            id="outlined-select-currency"
            label="Search location"
            value={createJob.location}
            error={!!errors["location"]}
            helperText={errors["location"]}
            onChange={(e) => handleChange(e)}
            fullWidth
            size="small"
            name="location"
            sx={{ marginBottom: "20px" }}
            aria-disabled={true}
          ></TextField>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            sx={{ marginRight: "5px" }}
            onClick={onCreateJob}
            autoFocus
          >
            Create
          </Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default CreateJobModal;
