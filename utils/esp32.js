const { espData, updateEspData, espConfigData, espHomeData, updateEspHomeData, tankInfo } = require("../db/espData");
const { sendError } = require("./helper");
const ConfigureData = require('../model/configureData');
const SupplyList = require("../model/supplyList");

// sets the sensor data to the data given by esp
exports.setSensorData = async (req, res) => {
    try {
        const sensorData = req.body;
        Object.entries(sensorData).forEach((e) => { if (espData[e[0]] !== undefined) { espData[e[0]] = e[1] } });
        // console.log("setEspData: ", espData);
        //console.log("espData: ",espData);

        if (sensorData.motorOn && sensorData.tankFull) {
            updateEspData.motorOn = false;
        }
        res.json({ msg: "Sensor data recieved", udata: updateEspData });
        // checks if the water passed or esp configuration data has to be updated
        // after sending it one time it is marked as no data to update
        if (updateEspData.resetWater) {
            updateEspData.resetWater = false;
        }
        if(updateEspData.updateConfigData){
            updateEspData.updateConfigData= false;
        }
    } catch (error) {
        console.log(error);
        sendError(res,"Failed to set Data");
    }
}

// sets the sensor data to the data given by esp (upper to home tank)
exports.setHomeData = async (req, res) => {
    try {
        const sensorData = req.body;
        Object.entries(sensorData).forEach((e) => { if (espHomeData[e[0]] !== undefined) { espHomeData[e[0]] = e[1] } });
        // console.log("setEspHomeData: ", espHomeData);
        //console.log("espHomeData: ",espHomeData);

        res.json({ msg: "Sensor data recieved", udata: updateEspHomeData.data });
        if(updateEspHomeData.data[0].resetFlow){
            // console.log("\n\n\nReset waterFlow\n\n")
            updateEspHomeData.data[0].resetFlow= false;
        }if(updateEspHomeData.data[1].resetFlow){
            updateEspHomeData.data[1].resetFlow= false;
        }
    } catch (error) {
        console.log(error);
        sendError(res,"Failed to set Data");
    }
}

let skiptime = 0;
// sends the local server data to frontend
exports.getSensorData = async (req, res) => {
    try {
        // checks if the data is updated
        if (espData.buildLed !== updateEspData.buildLed) {
            if (skiptime < 2) {
                espData.buildLed = updateEspData.buildLed;
            } else {
                // if data is not updated after 2 calls then updated data is changed to what we have
                updateEspData.buildLed = espData.buildLed;
            }
            skiptime++
        } else if (espData.motorOn !== updateEspData.motorOn) {
            if (skiptime < 2) {
                espData.motorOn = updateEspData.motorOn;
            } else {
                updateEspData.motorOn = espData.motorOn;
            }
            skiptime++
        } else {
            skiptime = 0;
        }
        console.log("getEspData: ", espData);
        res.json({ data: espData, status: 'ok' })
    } catch (error) {
        console.log(error);
        sendError(res,"failed yo get esp data");
    }
}

// set the updated local esp data with te given data
exports.updateSensorData = async (req, res) => {
    try {
        const { buildLed, motorOn, resetWater,updateConfigData} = req.body.data;
        // console.log(sensorData.buildLed);
        if (buildLed !== undefined) {
            espData.buildLed = buildLed;
            updateEspData.buildLed = buildLed;
        }
        if (motorOn !== undefined) {
            espData.motorOn = motorOn;
            updateEspData.motorOn = motorOn;
        }
        if (resetWater !== undefined) {
            updateEspData.resetWater = resetWater;
        }if(updateConfigData!= undefined){
            updateEspData.updateConfigData= updateConfigData;
        }
        console.log('updated data: ', updateEspData);
        res.json({ msg: "Sensor data updated", status: 'ok' })
    } catch (error) {
        console.log(error);
        sendError(res,"Failed to update sensor data");
    }
}

// sets the tank depth locally
exports.setTankInfo = async (req, res) => {
    try {
        console.log("setTankInfo: ", req.body);
        const {UTDepth,LTDepth}= req.body;
        if(UTDepth && LTDepth){
            tankInfo.UTDepth= UTDepth;
            tankInfo.LTDepth= LTDepth;
        }
        
            espConfigData.checkDepth= false;
            updateEspData.updateConfigData= false;
         
         res.json({msg:"tank info updated successful" ,status:"ok"});
     } catch (error) {
         console.log(error);
         sendError(res,"Failed to set tankInfo");
     }
}

// sends the tank depth
exports.getTankInfo = async (req, res) => {
    try {
        console.log("getTankInfo: ", tankInfo);
         //console.log("espConfigData: ",espConfigData);
         res.json({tankInfo:tankInfo ,status:"ok"});
     } catch (error) {
         console.log(error);
         sendError(res,"Failed to get TankInfo");
     }
}

// sends the esp configuration data
exports.getEspConfigData = async (req, res) => {
    try {
        console.log("getEspConfigData: ", espConfigData);
         //console.log("espConfigData: ",espConfigData);
         res.json({udata: espConfigData ,status:"ok"});
     } catch (error) {
         console.log(error);
         sendError(res,"Failed to set Data");
     }
}

// update the local esp configuration data on server
exports.setEspConfigData = async (req, res) => {
    try {
        const configData = req.body.configData;
        Object.entries(configData).forEach((e) => {
            if (espConfigData[e[0]] !== undefined) { espConfigData[e[0]] = e[1] } });
        console.log("setEspConfigData: ", espConfigData);
        //console.log("espConfigData: ",espConfigData);
        await updateEspConfigData(req.userID)
        res.json({ msg: "config data recieved"});
    } catch (error) {
        console.log(error);
        sendError(res,"Failed to set Data");
    }
}

// update the configuration data on the database
const updateEspConfigData = async (userID) => {
    if(!userID){
        return sendError("User not found");
    }
    const config = await ConfigureData.findOne({owner:userID});
    if(config){
        config.updateData(espConfigData);
    }else{
        const {UTDepth,LTDepth,UTShape,LTShape,UTR1,UTR2,LTR1,LTR2,maxFill} = espConfigData;
        const newConfig = new ConfigureData({owner:userID,UTDepth,LTDepth,UTShape,LTShape,UTR1,UTR2,LTR1,LTR2,maxFill});
        newConfig.save();
    }
}

// update the local esp config data with the database data
exports.fetchEspConfigData = async (req, res) => {
    try {
        const userID= req.userID;
        if(!userID){
            return sendError("User not found");
        }
        const config = await ConfigureData.findOne({owner:userID});
        if(config){
            espConfigData.UTDepth= config.UTDepth;
            espConfigData.LTDepth= config.LTDepth;
            espConfigData.UTShape= config.UTShape;
            espConfigData.LTShape= config.LTShape;

            espConfigData.UTR1= config.UTR1;
            espConfigData.UTR2= config.UTR2;
            espConfigData.LTR1= config.LTR1;
            espConfigData.LTR2= config.LTR2;
            espConfigData.maxFill= config.maxFill;
        }
        res.json({ msg:"esp config data fetched", status: 'ok' })
    } catch (error) {
        console.log(error);
        sendError(res,"failed to fetch esp config data");
    }
}

// save the supply list to database
exports.saveSupplyList = async (req, res) => {
    try {
        let list = req.body.supplyList;
        list = list.map((e)=>{
            return(
                {
                    room:e.room,
                    name:e.name,
                    supplyOn:e.supplyOn
                }
            )
        })
        console.log(list);
        const userID= req.userID;
        if(!userID){
            return sendError("User not found");
        }
        let slist = await SupplyList.findOne({owner:userID});
        if(slist){
            slist.updateList(userID,list);
        }else{
            slist= new SupplyList({owner:userID,roomList:list});
            slist.save();
        }
        console.log("SupplyList Updated.");
        res.json({ msg: "Supply List  updated", status: 'ok' })
    } catch (error) {
        console.log(error);
        sendError(res,"Failed to update sensor data");
    }
}

// gets the supply list from the database
exports.getSupplyList = async (req, res) => {
    try {
        const userID= req.userID;
        if(!userID){
            return sendError("User not found");
        }
        let slist = await SupplyList.findOne({owner:userID});
        if(slist){
            res.json({ supplyList: slist, status: 'ok' })
            console.log("Got SupplyList");
        }else{
            res.json({ msg: "Supply List not found!", status: 'ok' })
        }
    } catch (error) {
        console.log(error);
        sendError(res,"Failed to update sensor data");
    }
}

let skipHomeData= 0;
// sends the local server data to frontend (upper to home tank)
exports.getHomeData = async (req, res) => {
    try {
        // checks if the data is updated
        /*
        if (espHomeData.supplyOn !== updateEspHomeData.supplyOn) {
            if (skipHomeData < 2) {
                espHomeData.supplyOn = updateEspHomeData.supplyOn;
            } else {
                // if data is not updated after 2 calls then updated data is changed to what we have
                updateEspHomeData.buildLed = espHomeData.buildLed;
            }
            skipHomeData++
        }else {
            skiptime = 0;
        }
        */
        console.log("getEspHomeData: ", espHomeData);
        res.json({ data: espHomeData, status: 'ok' })
    } catch (error) {
        console.log(error);
        sendError(res,"failed yo get esp home data");
    }
}

// set the updated local esp home data with te given data
exports.updateHomeData = async (req, res) => {
    try {
        let homedata = req.body.data;
        console.log('got home updated data: ', homedata);
        // console.log(sensorData.buildLed);
        if (homedata.length>0) {
            updateEspHomeData.data.forEach((data)=>{
                if(data.roomNo===homedata[0].roomNo){
                    data.supplyOn= homedata[0].supplyOn;
                    if(homedata[0].resetFlow){
                        data.resetFlow= homedata[0].resetFlow;
                    }
                }else if(homedata.length>1 && data.roomNo===homedata[1].roomNo){
                    data.supplyOn= homedata[1].supplyOn;
                    if(homedata[1].resetFlow){
                        data.resetFlow= homedata[1].resetFlow;
                    }
                }
            })
        }else{
            return sendError(res,"home data not given");
        }
        console.log('home updated data: ', updateEspHomeData);
        res.json({ msg: "Home data updated", status: 'ok' })
    } catch (error) {
        console.log(error);
        sendError(res,"Failed to update home data");
    }
}