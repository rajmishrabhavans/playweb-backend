//for lower to upper tank
exports.espData ={
    index: 0,
    upperTank: 0,
    lowerTank: 0,
    UTVolume: 0,
    LTVolume: 0,
    tankFull: false,
    buildLed: false,
    motorOn: false
}

exports.updateEspData ={
    buildLed: false,
    motorOn: false,
    resetWater: false,
    updateConfigData: false,
    checkDepth:false
}

//for upper to home tank
exports.espHomeData ={
    index: 0,
    roomData:[
        {
            roomNo:1,
            flowSpeed: 0,
            waterPassed: 0,
            supplyOn: false
        },
        {
            roomNo:2,
            flowSpeed: 0,
            waterPassed: 0,
            supplyOn: false
        }
    ]
}

exports.updateEspHomeData ={
    data:[
        {
            roomNo:1,
            supplyOn: false,
            resetFlow: false
        },
        {
            roomNo:2,
            supplyOn: false,
            resetFlow: false
        }
    ]
}

//configuration data
exports.espConfigData ={
    UTDepth:15,
    LTDepth:15,
    UTShape: "frustum",
    LTShape: "frustum",
    UTR1: 5.25,
    UTR2: 5.05,
    LTR1: 5.55,
    LTR2: 4.95,
    maxFill: 95,
    minFill: 10,
    checkDepth:false
}

//to fetch tank depth
exports.tankInfo= {
    UTDepth:false,
    LTDepth:false
}
