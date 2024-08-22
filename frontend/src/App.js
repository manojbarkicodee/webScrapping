import React, { useContext, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Card,
  CardContent,
  Container,
  Drawer,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import InfoIcon from "@mui/icons-material/Info";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StatusIcon from "@mui/icons-material/AssignmentTurnedIn"; // Example icon for status
import JobIcon from "@mui/icons-material/Work"; // Example icon for job ID
import SearchIcon from "@mui/icons-material/Search"; // Example icon for search keyword
import LocationIcon from "@mui/icons-material/LocationOn"; // Example icon for location
import CreatedIcon from "@mui/icons-material/AccessTime"; // Example icon for created at
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import "./App.css";
import Navbar from "./components/navbar/Navbar";
import Home from "./components/home/Home";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import Contacts from "./components/contacts/Contacts";
import HistoryIcon from "@mui/icons-material/History";
import { NotificationContext } from "./components/noticationContext/notificationContext";
import axios from "axios";
import AlertPopUp from "./components/alertPopUp/AlertPopUp";
function App() {
  // const [open, setOpen] = useState(false);

  // const toggleDrawer = (newOpen) => () => {
  //   setOpen(newOpen);
  // };
  const { notificationOpen, toggleDrawer } = useContext(NotificationContext);
  const [loading,setLoading]=useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertData, setAlertData] = useState({
    severity: "",
    message: "",
  });
  const onClickNotification = () => {
    toggleDrawer(false);
  };
  const handleAlertClose = () => {
    setAlertOpen(false);
  };
  const [notifications, setnotifications] = useState([]);
  useEffect(() => {
    (async () => {
      setLoading(true)
      await getNotifications();
      setLoading(false)
    })();
  }, [notificationOpen]);

  useEffect(() => {
    if (alertData.message) {
      handleAlertOpen();
    }
  }, [alertData.message]);

  const handleAlertOpen = () => {
    setAlertOpen(true);
  };

  const getNotifications = async () => {
    try {
      if (notificationOpen) {
        let notifications = await axios.get(
          `${process.env.REACT_APP_API_URL}/notifications`
        );
        setnotifications(
          notifications.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      let response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/deleteNotification/${notificationId}`
      );
      let message = response.data.message;
      setAlertData({ severity: "success", message: message });
      await getNotifications();
      setTimeout(() => {
        setAlertData({ severity: "", message: "" });
      }, 3000);
    } catch (error) {
      if (error.message) {
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

  const DrawerList = (
    <Box sx={{ width: 300 }} role="presentation">
      <List sx={{ paddingTop: "0px" }}>
        <h3 className={"historyHeader"}>NOTIFICATIONS</h3>
        {!loading &&notifications.length === 0 && (
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText className={"history"} primary="No Notifications" />
            </ListItemButton>
          </ListItem>
        )}
        {notifications.map((notification, index) => (
          <Card
            sx={{
              m: 1,
              padding: "5px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            onClick={onClickNotification}
          >
            <CardContent
              sx={{ flex: "1 0 auto", padding: "5px", paddingBottom: "5px" }}
            >
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} alignItems="center">
                  <DeleteForeverIcon
                    className="notificationDeleteIcon"
                    onClick={(e) => deleteNotification(e, notification._id)}
                  ></DeleteForeverIcon>
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <InfoIcon
                      sx={{ marginRight: "10px", fontSize: "25px" }}
                    ></InfoIcon>

                    {notification?.jobRefId?.name
                      ? notification.jobRefId.name
                      : notification?.jobId}
                  </Typography>
                  <Typography
                    variant="h7"
                    fontWeight={"bold"}
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <StatusIcon
                      sx={{ marginRight: "10px", fontSize: "25px" }}
                    />{" "}
                    <span
                      style={{
                        color:
                          notification.status === "Inprogress"
                            ? "#1976d2"
                            : notification.status === "Failed"
                            ? "red"
                            : "#388e3c",
                      }}
                    >
                      {notification?.status}
                    </span>
                  </Typography>
                  {/* <Typography variant="body1" gutterBottom   sx={{display:"flex",alignItems:"center"}}>
            <JobIcon sx={{marginRight:"10px"}} /> {notification.jobRefId._id}
          </Typography> */}
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <SearchIcon
                      sx={{ marginRight: "10px", fontSize: "25px" }}
                    />{" "}
                    {notification?.jobRefId?.searchKeyword}
                  </Typography>
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <LocationIcon
                      sx={{ marginRight: "10px", fontSize: "25px" }}
                    />{" "}
                    {notification?.jobRefId?.location}
                  </Typography>
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <EventBusyIcon
                      sx={{ marginRight: "10px", fontSize: "25px" }}
                    />{" "}
                    {notification?.scheduler?.name}
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ p: 0, pt: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ display: "flex", alignItems: "center" }}
                  color="textSecondary"
                >
                  <CreatedIcon sx={{ marginRight: "10px" }} />{" "}
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          // <ListItem key={index} disablePadding sx={{ paddingTop: "10px" }}>
          //   <ListItemButton
          //     data-testid="list"
          //     onClick={() =>
          //       onClickHistory(notification.searchId, notification.limit)
          //     }
          //   >
          //     {/* <Badge
          //       className={"limitCount"}
          //       sx={{ top: "-3px!important", right: "10px!important" }}
          //       badgeContent={notification.limit}
          //       color="secondary"
          //     > */}
          //       {/* <ListItemIcon className={"historyIcon"}>
          //         <HistoryIcon />
          //       </ListItemIcon>
          //     </Badge> */}

          //     <Tooltip
          //       placement="top"
          //       arrow
          //       title={`${notification.jobRefId.searchKeyword}-${notification.jobRefId.location}`}
          //     >
          //       <ListItemText
          //         className={"history"}
          //         primary={`${notification.jobRefId.searchKeyword}-${notification.jobRefId.location}`}
          //       />
          //     </Tooltip>
          //   </ListItemButton>
          // </ListItem>
        ))}
      </List>
    </Box>
  );
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Outlet />, // This will be the root outlet
      children: [
        { index: true, element: <Navigate to="/jobs" replace /> },
        {
          path: "jobs",
          element: <Home />,
        },
        {
          path: "jobs/:jobRefId",
          element: <Contacts />,
        },
        {
          path: "contacts",
          element: <Contacts />,
        },
      ],
    },
  ]);
  return (
    <div className="App">
      <Container maxWidth="xl">
        <AlertPopUp
          severity={alertData.severity}
          message={alertData.message}
          alertOpen={alertOpen}
          handleClose={handleAlertClose}
        ></AlertPopUp>
        <Navbar data-testid="navbar"></Navbar>
        <Drawer
          open={notificationOpen}
          anchor={"right"}
          data-testid="drawer"
          onClose={toggleDrawer(false)}
        >
          {DrawerList}
        </Drawer>
        <RouterProvider router={router}>
          <div className="topab" style={{ position: "absolute", top: "100px" }}>
            <Outlet></Outlet>
          </div>

          {/* <Home open={open} toggleDrawer={toggleDrawer} data-testid="home"></Home> */}
        </RouterProvider>
      </Container>
    </div>
  );
}

export default App;
