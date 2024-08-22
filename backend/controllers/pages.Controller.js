const { pagesDataModel } =require("../models/pagesModel");

const addPage = async (data) => {
  try {
    let page = await pagesDataModel.create(data);
    return page;
  } catch (error) {
    console.log(error);
  }
};

module.exports={addPage}
