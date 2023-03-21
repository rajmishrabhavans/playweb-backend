const mongoose = require('mongoose');

//creating scema and validation for adding data to DB
const supplyListSchema= new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastSupply:{
        type:String,
    },
    roomList:[
        {   
            wing:{
                type:String,
                required:true
            },
            room:{
                type:Number,
                // unique:true,
                required:true
            },
            name:{
                type:String,
                required:true
            },
            email:{
                type:String,
                required: true
            },
            age:{
                type:String,
                required: true
            },
            mobile: {
                type: Number,
                required: true
            },
            ownership: {
                type: String,
                required: true
            },
            status: {
                type: String,
                required: true
            },
            supplyOn:{
                type:Boolean,
                default: false,
                required:true
            }
        }
    ]
});

supplyListSchema.methods.updateList = async function(owner,list,lastSupply=undefined){
    try {
        if(list){
            this.owner= owner
            this.roomList= list;
            if(lastSupply){
                this.lastSupply= lastSupply
            }
            this.save();
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

supplyListSchema.methods.updateSupplyDetails = async function(supplyDetails){
    if(supplyDetails.lastSupply){
        this.lastSupply= supplyDetails.lastSupply
    }
    this.save();
}

module.exports = mongoose.model("supplyList",supplyListSchema);