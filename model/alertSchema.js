const mongoose = require('mongoose');

//creating scema and validation for adding data to DB
const alertSchema= new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    read:{
        type:Number,
    },
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
        if(this.alerts.length>50){
            this.alerts= this.alerts.shift();
        }
        const res= await this.save();
        return res;
    } catch (error) {
        console.log(error);
    }
}
alertSchema.methods.markRead = async function(){
    try {
        this.read= this.alerts.length;
        const res= await this.save();
        return res;
    } catch (error) {
        console.log(error);
    }
}


module.exports = mongoose.model("Alert",alertSchema);