import express from "express"  //importing Express type too
import cors from "cors"
import Connect from './Databaseconnect/databaseconnect.js'
import router from "./Routes/userroute.js";
import roomrouter from "./Routes/roomroute.js";
import dotenv from 'dotenv';
import {server} from "./Services/socketconnection.js";
import http from "http";
import newConnection from "./Services/newconnectiondetect.js";
dotenv.config();


const app=express();
//create httpserver
const httpserver=http.createServer(app);//app acting as a request handler function




app.use(cors());
app.use(express.json())//for json obj in req body
Connect();//connect database

//socket server esatblished;
server(httpserver); 
newConnection(); //It check new connection to the host:localhost/5000



app.get('/',(req,res)=>{
    res.end("Request is successfully received on server");
});
app.use('/',router);
app.use('/',roomrouter);





httpserver.listen(5000,()=>{
    console.log("Server started at 5000");
})