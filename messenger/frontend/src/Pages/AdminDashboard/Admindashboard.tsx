import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type User = {
  username: string;
  role: "User" | "Agent" | "Admin";
  status: "Online" | "Offline";
};

type ChatRoom = {
  roomId: string;
  user: string;
  agent?: string;
  messagesCount: number;
};

const AdminDashboard: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedAgentUsername, setSelectedAgentUsername] = useState<string | null>(null);

  // Connect to socket.io server
  useEffect(() => {
    const socketClient = io("http://localhost:5000"); // Adjust your server URL
    setSocket(socketClient);

    // Listen for real-time user status updates from backend
    socketClient.on("user-status-list", (usersFromServer: User[]) => {
      // Separate users and agents
      const allUsers = usersFromServer.filter((u) => u.role === "User");
      const allAgents = usersFromServer.filter((u) => u.role === "Agent");
      setUsers(allUsers);
      setAgents(allAgents);
    });

    // Cleanup on unmount
    return () => {
      socketClient.disconnect();
    };
  }, []);

  // Fetch chat rooms from your backend API (replace with actual API call)
  useEffect(() => {
    const fetchChatRooms = async () => {
      // Example: replace with your real fetch
      // const res = await fetch("http://localhost:5000/api/rooms");
      // const data = await res.json();
      // setChatRooms(data.rooms);

      // Mock for demo
      setChatRooms([
        { roomId: "r1", user: "user1", agent: "agent1", messagesCount: 10 },
        { roomId: "r2", user: "user2", messagesCount: 3 },
      ]);
    };

    fetchChatRooms();
  }, []);

  // Assign agent to chat room API call + update state
  const assignAgentToRoom = async () => {
    if (!selectedRoomId || !selectedAgentUsername) {
      alert("Select both a chat room and an agent");
      return;
    }

    try {
      // TODO: Call your backend API to assign agent to room
      // await fetch("http://localhost:5000/api/assign-agent", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ roomId: selectedRoomId, agentUsername: selectedAgentUsername }),
      // });

      // Update local state optimistically
      setChatRooms((prev) =>
        prev.map((room) =>
          room.roomId === selectedRoomId ? { ...room, agent: selectedAgentUsername } : room
        )
      );

      alert("Agent assigned successfully!");
    } catch (error) {
      alert("Error assigning agent");
    }
  };

  // Export chat history to JSON
  const exportChatHistory = () => {
    const chatHistory = chatRooms.map(({ roomId, user, agent, messagesCount }) => ({
      roomId,
      user,
      agent: agent || "Unassigned",
      messagesCount,
    }));
    const json = JSON.stringify(chatHistory, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat_history.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Online Agents</h2>
        <ul className="space-y-2">
          {agents.map((agent) => (
            <li
              key={agent.username}
              className="flex justify-between items-center p-3 bg-gray-100 rounded shadow"
            >
              <span>{agent.username}</span>
              <span
                className={`font-semibold ${
                  agent.status === "Online" ? "text-green-600" : "text-red-600"
                }`}
              >
                {agent.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Chat Rooms</h2>
        <ul className="space-y-3">
          {chatRooms.map((room) => {
            const isSelected = room.roomId === selectedRoomId;
            return (
              <li
                key={room.roomId}
                className={`flex justify-between items-center p-3 rounded shadow ${
                  isSelected ? "bg-blue-100" : "bg-white"
                }`}
              >
                <div>
                  <p>
                    <span className="font-semibold">Room ID:</span> {room.roomId}
                  </p>
                  <p>
                    <span className="font-semibold">User:</span> {room.user}
                  </p>
                  <p>
                    <span className="font-semibold">Agent:</span>{" "}
                    {room.agent || "Unassigned"}
                  </p>
                  <p>
                    <span className="font-semibold">Messages:</span> {room.messagesCount}
                  </p>
                </div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={() => setSelectedRoomId(room.roomId)}
                >
                  Select
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Assign Agent to Chat Room</h2>
        <div className="flex items-center space-x-4 max-w-md">
          <select
            className="border border-gray-300 rounded px-3 py-2 flex-grow"
            onChange={(e) => setSelectedAgentUsername(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Choose agent
            </option>
            {agents.map((agent) => (
              <option key={agent.username} value={agent.username}>
                {agent.username}
              </option>
            ))}
          </select>
          <button
            onClick={assignAgentToRoom}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Assign
          </button>
        </div>
        <p className="mt-2">
          Selected Room ID: <b>{selectedRoomId || "None"}</b>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Export Chat History</h2>
        <button
          onClick={exportChatHistory}
          className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Export JSON
        </button>
      </section>
    </div>
  );
};

export default AdminDashboard;
