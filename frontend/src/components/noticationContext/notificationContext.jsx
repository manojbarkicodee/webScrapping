import { createContext, useState } from "react";


export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    const toggleDrawer = (newOpen) => () => {
      if(newOpen){
        setHasUnread(false);
        localStorage.setItem('hasUnread', 'false'); 
      }
      setNotificationOpen(newOpen);
      if(!newOpen){
        window.location.reload();
      }
    };

  return (
    <NotificationContext.Provider
      value={{
        notificationOpen,toggleDrawer,hasUnread,setHasUnread
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};