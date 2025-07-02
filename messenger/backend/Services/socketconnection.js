import { getio } from "./socketconnection.js"; // your socket helper
import User from "../models/user.js";
import Room from "../models/room.js";

const newConnection = () => {
  const io = getio();
  if (!io) {
    console.error("Socket.IO not initialized!");
    return;
  }

  // Emit full user list with status to all clients
  const emitUserStatusList = async () => {
    try {
      const users = await User.find({}, "username role status").lean();
      io.emit("user-status-list", users);
    } catch (err) {
      console.error("Error emitting user status list:", err);
    }
  };

  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    // When user comes online (after login/authentication)
    socket.on("userOnline", async (username) => {
      try {
        await User.findOneAndUpdate({ username }, { status: "Online" });
        socket.username = username; // Save to socket to track on disconnect
        console.log(`${username} is Online`);

        await emitUserStatusList();
      } catch (error) {
        console.error("Error setting user online:", error);
      }
    });

    // User joins a room
    socket.on("joinroom", ({ roomId }) => {
      if (roomId) {
        socket.join(roomId);
        console.log(`${socket.username || "User"} joined room: ${roomId}`);
      }
    });

    // Typing indicator event (broadcast to others in the room)
    socket.on("typingstatus", ({ roomId, typingstatus }) => {
      socket.to(roomId).emit("msgstatus", { typingstatus });
    });

    // Handle sending message
    socket.on("sendmessage", async ({ roomId, sender, text, status, timestamp }) => {
      try {
        const newMessage = {
          sender,
          text,
          status,
          timestamp: new Date(timestamp),
        };
        // Save message to MongoDB
        await Room.findOneAndUpdate(
          { roomId },
          { $push: { messages: newMessage } },
          { new: true }
        );

        // Broadcast message to others in room
        socket.to(roomId).emit("receivemsg", newMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Mark a message as delivered
    socket.on("messageDelivered", async ({ roomId, messageId }) => {
      try {
        await Room.findOneAndUpdate(
          { roomId, "messages._id": messageId },
          { $set: { "messages.$.status": "delivered" } }
        );
        io.to(roomId).emit("messageDelivered", { messageId });
      } catch (error) {
        console.error("Error updating message to delivered:", error);
      }
    });

    // Mark messages as read
    socket.on("messageRead", async ({ roomId, messageIds }) => {
      try {
        await Room.updateOne(
          { roomId },
          { $set: { "messages.$[elem].status": "read" } },
          { arrayFilters: [{ "elem._id": { $in: messageIds } }] }
        );
        io.to(roomId).emit("messageRead", { messageIds });
      } catch (error) {
        console.error("Error updating messages to read:", error);
      }
    });

    // Handle user disconnecting
    socket.on("disconnect", async () => {
      if (socket.username) {
        try {
          await User.findOneAndUpdate({ username: socket.username }, { status: "Offline" });
          console.log(`${socket.username} disconnected and is now Offline`);

          await emitUserStatusList();
        } catch (error) {
          console.error("Error setting user offline:", error);
        }
      }
    });
  });
};

export default newConnection;
