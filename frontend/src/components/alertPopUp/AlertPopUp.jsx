import { Alert, Snackbar } from "@mui/material";
import React from "react";

const AlertPopUp = ({ alertOpen, severity, message, handleClose }) => {
  return (
    <Snackbar
      open={alertOpen}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={handleClose}
    >
      <Alert severity={severity} variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertPopUp;
