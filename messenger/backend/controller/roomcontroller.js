import Room from "../models/room.js";
import User from "../models/user.js";
import { v4 as uuidv4 } from "uuid"; // install with: npm install uuid

const registeredRoom = async (req, res) => {
  try {
    const { username, agent } = req.body;

    const user=await User.findOne({username:username});

    // Check if a room already exists for this user-agent pair (optional)
    const existingRoom = await Room.findOne({ user:user.fullname,agent:agent });
    if (existingRoom) {
      return res.status(200).json({
        message: "Room already exists",
        room: existingRoom,
      });
    }

    // Generate a unique room ID using uuid
    const roomId = uuidv4(); // e.g., 'f8b12f54-0c74-4b7c-b9a2-3ff1d80e7db3'

    // Create new room
    const newRoom = new Room({
      roomId,
      user:user.fullname,
      agent,
      messages: [], // empty initially
    });

    const savedRoom = await newRoom.save();
    res.status(201).json({
      message: "Room successfully created",
      room: savedRoom,
    });
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getroombyuser=async(req,res)=>{
    const{username}=req.body;
    const user= await User.findOne({username:username});
    console.log("Userfullname:user.fullname",user.fullname);
    const room= await Room.find({user:user.fullname});
    if(room.length===0){
        res.status(404).json({message:"Room not found for this user"});
    }
    else{
        res.status(201).json({message:"Returning list of room in which user is present",room:room});
    }
    
}

const getroombyagent=async(req,res)=>{
    const{username}=req.body;
    const agent= await User.findOne({username:username});
    const room= await Room.find({agent:agent.fullname});
    if(room.length===0){
        res.status(404).json({message:"Room not found for this agent"});
    }
    else{
        res.status(201).json({message:"Returning list of agent in which agent is present",room:room});
    }
}

export  {registeredRoom,getroombyuser,getroombyagent};
