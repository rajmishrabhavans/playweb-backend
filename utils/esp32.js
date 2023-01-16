const { espData, updateEspData } = require("../db/espData");
const { sendError } = require("./helper");

exports.setSensorData = async (req, res) => {
    const sensorData= req.body;
    console.log(req.body);
    Object.entries(sensorData).forEach((e) => {if(espData[e[0]]!==undefined){espData[e[0]]= e[1]}});
    //console.log("espData: ",espData);
    res.json({msg:"Sensor data recieved",udata:updateEspData});
}

exports.getSensorData = async (req, res) => {
    if(!espData){
        sendError("Data not found!",404);
    }
    console.log("getEspData: ",espData);
    res.json({data:espData,status:'ok'})
}

exports.updateSensorData = async (req, res) => {
    const sensorData= req.body.data;
    // console.log(sensorData.buildLed);
    if(sensorData.buildLed!==undefined){
    updateEspData.buildLed= sensorData.buildLed;
    }
    if(sensorData.motorOn!==undefined){
    updateEspData.motorOn= sensorData.motorOn;
    }
    console.log('updated data: ',updateEspData);
    res.json({msg:"Sensor data updated",status:'ok'})
}