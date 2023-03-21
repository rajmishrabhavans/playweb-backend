const mongoose = require('mongoose');

//creating scema and validation for adding data to DB
const alertSchema= new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // timeStamp:{
    //     type:String,
    // },
    alerts:[
        {   
            timeStamp:{
                type:String,
                required:true
            },
            type:{
                type:String,
                required:true
            },
            message:{
                type:String,
                required: true
            },
        }
    ]
});

alertSchema.methods.addAlert = async function(alert){
    try {
        this.alerts= this.alerts.concat(alert);
        const res= await this.save();
        return res;
    } catch (error) {
        console.log(error);
    }
}


module.exports = mongoose.model("Alert",alertSchema);