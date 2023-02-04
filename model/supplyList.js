const mongoose = require('mongoose');

//creating scema and validation for adding data to DB
const supplyListSchema= new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomList:[
        {
            room:{
                type:Number,
                unique:true,
                required:true
            },
            name:{
                type:String,
                required:true
            },
            supplyOn:{
                type:Boolean,
                required:true
            }
        }
    ]
});

supplyListSchema.methods.updateList = async function(owner,list){
    try {
        if(list){
            this.owner= owner
            this.roomList= list;
            this.save();
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = mongoose.model("supplyList",supplyListSchema);