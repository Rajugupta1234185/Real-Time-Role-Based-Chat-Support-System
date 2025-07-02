import { getio } from "./socketconnection.js";
import User from "../models/user.js";
import Room from "../models/room.js";

const newConnection = () => {
  const io = getio();

  io.on("connection", (socket) => {
    console.log("New connection with connectionId:", socket.id);

    // User comes online
    socket.on("userOnline", async (username) => {
      console.log("User connected:", username);
      try {
        await User.findOneAndUpdate(
          { username },
          { status: "Online" }
        );
        socket.username = username; // Save username for disconnect event
      } catch (error) {
        console.error("Error setting user online:", error);
      }
      io.emit("updatestatus"); // Broadcast updated user status to all clients
    });

    // User joins a chat room
    socket.on("joinroom", async ({ roomId }) => {
      if (roomId) {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      } else {
        console.log("Join room received without roomId");
      }
    });

    // Broadcast typing status to others in the room
    socket.on("typingstatus", ({ roomId, typingstatus }) => {
      socket.to(roomId).emit("msgstatus", { typingstatus });
    });

    // Handle sending a message
    socket.on("sendmessage", async ({ roomId, sender, text, status, timestamp }) => {
      try {
        const newMessage = {
          sender,
          text,
          status,
          timestamp: new Date(timestamp),
        };
        // Save message to DB in the specified room
        const updatedRoom = await Room.findOneAndUpdate(
          { roomId },
          { $push: { messages: newMessage } },
          { new: true }
        );
        // Broadcast the new message to others in the room
        socket.to(roomId).emit("receivemsg", newMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Update message status to 'delivered'
    socket.on("messageDelivered", async ({ roomId, messageId }) => {
      try {
        await Room.findOneAndUpdate(
          { roomId, "messages._id": messageId },
          { $set: { "messages.$.status": "delivered" } }
        );
        // Notify all clients in the room about delivery status
        io.to(roomId).emit("messageDelivered", { messageId });
      } catch (error) {
        console.error("Error updating message to delivered:", error);
      }
    });

    // Update multiple messages' status to 'read'
    socket.on("messageRead", async ({ roomId, messageIds }) => {
      try {
        await Room.updateOne(
          { roomId },
          { $set: { "messages.$[elem].status": "read" } },
          { arrayFilters: [{ "elem._id": { $in: messageIds } }] }
        );
        // Notify all clients in the room about read status update
        io.to(roomId).emit("messageRead", { messageIds });
      } catch (error) {
        console.error("Error updating messages to read:", error);
      }
    });

    // Handle user disconnecting
    socket.on("disconnect", async () => {
      if (socket.username) {
        try {
          await User.findOneAndUpdate(
            { username: socket.username },
            { status: "Offline" }
          );
          console.log(`${socket.username} disconnected and is now Offline`);
        } catch (error) {
          console.error("Error setting user offline:", error);
        }
        io.emit("updatestatus"); // Update status for all clients
      }
    });
  });
};

export default newConnection;
