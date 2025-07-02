import { registeredRoom,getroombyagent,getroombyuser } from "../controller/roomcontroller.js";

import express from "express";
const roomrouter=express.Router();

roomrouter.post("/registeredroom",registeredRoom);
roomrouter.post("/getroombyuser",getroombyuser);
roomrouter.post("/getroombyagent",getroombyagent);

export default roomrouter;