const mongoose = require('mongoose');

//creating scema and validation for adding data to DB
const configureDataSchema= new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    UTDepth:{
        type: Number,
        required:true
    },
    LTDepth:{
        type: Number,
        required:true
    },
    UTShape:{
        type: String,
        required:true
    },
    LTShape:{
        type: String,
        required:true
    },
    UTR1:{
        type: Number,
        required:true
    },
    UTR2:{
        type: Number,
        required:true
    },
    LTR1:{
        type: Number,
        required:true
    },
    LTR2:{
        type: Number,
        required:true
    },
    maxFill:{
        type:Number,
        required:true
    }
});

configureDataSchema.methods.updateData = async function(data){
    try {
        this.UTDepth= data.UTDepth;
        this.LTDepth= data.LTDepth;
        this.UTShape= data.UTShape;
        this.LTShape= data.UTShape;
        this.UTR1= data.UTR1;
        this.UTR2= data.UTR2;
        this.LTR1= data.LTR1;
        this.LTR2= data.LTR2;
        this.maxFill= data.maxFill;
        this.save();
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = mongoose.model("configureData",configureDataSchema);