const { jobsDataModel } = require("../models/jobsModel");
const { notificationDataModel } = require("../models/notificationsModel");
const { broadcastMessage } = require("../websocket");

const addNotification = async (data) => {
  try {
    let notification = await notificationDataModel.create(data);
    
    const jobId = notification.jobId;
    let job = await jobsDataModel.findOne({ jobId });
    
    if (job) {
      job.statusHistory.push({
        status: notification.status,
        createdAt: notification.createdAt, 
        scheduler:notification.scheduler
      });
      
      await job.save();
      
      broadcastMessage(JSON.stringify({message:"New notification added",jobId:job.jobId,type:"scrapping job"}));
    } else {
      console.log(`Job with jobId ${jobId} not found.`);
    }
  } catch (error) {
    console.log(error.message);
  }
};


const getNotications = async (req, res) => {
  try {
    let notifications = await notificationDataModel.find({deleted:false}).populate({
      path: "jobRefId",
      select: "searchKeyword location name", 
    });
    res.status(200).send(notifications);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

const deleteNotification = async (req, res) => {
  try {
    let { notificationId } = req.params;
    let response = await notificationDataModel.findByIdAndUpdate(notificationId,{deleted:true});
    if (response) {
      res.status(200).send({ message: "Notification deleted successfully" });
    } else {
      res.status(404).send({ message: "Notification not found" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = { addNotification, getNotications,deleteNotification };
