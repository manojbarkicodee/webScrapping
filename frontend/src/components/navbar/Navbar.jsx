import React, { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { Badge, Tooltip } from "@mui/material";
import { useContext } from "react";
import { NotificationContext } from "../noticationContext/notificationContext";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import useWebSocket from "react-use-websocket";
const Navbar = () => {
  let { toggleDrawer, setHasUnread, hasUnread } =
    useContext(NotificationContext);
  let wsUrl = process.env.REACT_APP_SOCKET_URL;

  const [socketUrl, setSocketUrl] = useState(wsUrl);
  const [messageHistory, setMessageHistory] = useState([]);
  const { lastMessage } = useWebSocket(socketUrl);
  useEffect(() => {
    if (lastMessage !== null) {
      console.log("lastMessage=====>",lastMessage);
      let newlastMessage=JSON.parse(lastMessage.data)
      if(newlastMessage.type==="scrapping job"){
        setMessageHistory((prev) => prev.concat(lastMessage));
        setHasUnread(true);
        localStorage.setItem("hasUnread", "true");
      }

    }
  }, [lastMessage]);

  useEffect(() => {
    const storedHasUnread = localStorage.getItem("hasUnread");
    if (storedHasUnread === "true") {
      setHasUnread(true);
    }
  }, []);

  return (
    <Box sx={{ display: "flex" }} data-testid="navbar">
      <CssBaseline />
      <AppBar component="nav" sx={{ background: "#FF6F61" }}>
        <Toolbar sx={{ padding: "20px" }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, textAlign: "left" }}
            
          >
            <a style={{color:"white"}} href="http://localhost:4000" >
            WEB SCRAPPING

            </a>
          </Typography>
          <Tooltip placement="top" title="Notifications" arrow>
            <Badge
              color="success"
              variant="dot"
              invisible={!hasUnread}
              classes={{ dot: hasUnread ? "blinking-dot" : "" }}
            >
              <NotificationsActiveIcon
                data-testid="historyIcon"
                onClick={toggleDrawer(true)}
                sx={{
                  fontSize: "20px!important",
                  width: "2rem!important",
                  height: "2rem!important",
                  cursor: "pointer",
                }}
              />
            </Badge>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 3 }}>
        <Toolbar />
      </Box>
    </Box>
  );
};

export default Navbar;
