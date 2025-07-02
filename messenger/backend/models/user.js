import mongoose from "mongoose";

const UserSchema=mongoose.Schema({
    fullname:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
    ,
    role:{
        type:String,
        enum:['User','Admin','Agent'],
        default:'User'
    },
    status:{
        type:String,
        enum:['Online','Offline'],
        default:'Offline'
    }
},{
    timestamp:true
});

const User=mongoose.model("user",UserSchema);
export default User;