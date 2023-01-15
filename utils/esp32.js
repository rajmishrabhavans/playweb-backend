
exports.setSensorData = async (req, res) => {
    console.log(req.body);
    const {data_key,data} = req.body;
    res.json({msg:"Sensor data recieved"})
  }
  