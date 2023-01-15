const { espData } = require("../db/espData");
const { sendError } = require("./helper");

exports.setSensorData = async (req, res) => {
    const sensorData= req.body;
    console.log(req.body);
    Object.entries(sensorData).forEach((e) => {if(espData[e[0]]!==undefined){espData[e[0]]= e[1]}});
    //console.log("espData: ",espData);
    res.json({msg:"Sensor data recieved",status:'ok'})
}

exports.getSensorData = async (req, res) => {
    console.log(espData);
    if(!espData){
        sendError("Data not found!",404);
    }
    console.log("espData: ",espData);
    res.json({data:espData,status:'ok'})
}