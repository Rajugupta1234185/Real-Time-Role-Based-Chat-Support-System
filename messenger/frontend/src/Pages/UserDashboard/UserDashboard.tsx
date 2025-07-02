import React, { useState, useEffect, useRef } from "react";
import { AiFillNotification } from "react-icons/ai";
import { FaUserLarge } from "react-icons/fa6";
import { io, Socket } from "socket.io-client";
import axios from "axios";

type User = {
  username: string;
  fullname: string;
  status: string;
  role: string;
};

type Messages = {
  _id: string; // Added _id to uniquely identify messages
  sender: string;
  text: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read"; // Use specific status union
};

type Room = {
  user: string;
  agent: string;
  roomId: string;
  messages: Messages[];
};

type Roomwithstatus = Room & { status: string };

export default function AgentDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<User | null>(null);
  const [agent, setAgent] = useState<User[]>([]);
  const [agentSelect, setAgentSelect] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [roomwithstatus, setroomwithstatus] = useState<Roomwithstatus[]>([]);
  const [activeroom, setactiveroom] = useState<Roomwithstatus | null>(null);
  const [textmsg, settextmsg] = useState<string>("");
  const [typingstatus, settypingstatus] = useState<boolean>(false);
  const [msgarray, setmsgarray] = useState<Messages[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/getuser");
      setUsers(res.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Socket initialization & listeners
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      console.log("Connected", socketRef.current?.id);
      const username = localStorage.getItem("username");
      if (username) socketRef.current?.emit("userOnline", username);
    });

    // Receive a new message
    socketRef.current.on("receivemsg", (newMessage: Messages) => {
      setmsgarray((prevMsgs) => [...prevMsgs, newMessage]);

      // Emit delivered status immediately back to server
      socketRef.current?.emit("messageDelivered", {
        roomId: activeroom?.roomId,
        messageId: newMessage._id,
      });
    });

    // Update message status to delivered
    socketRef.current.on(
      "messageDelivered",
      ({ messageId }: { messageId: string }) => {
        setmsgarray((prevMsgs) =>
          prevMsgs.map((msg) =>
            msg._id === messageId && msg.status === "sent"
              ? { ...msg, status: "delivered" }
              : msg
          )
        );
      }
    );

    // Update message status to read
    socketRef.current.on(
      "messageRead",
      ({ messageIds }: { messageIds: string[] }) => {
        setmsgarray((prevMsgs) =>
          prevMsgs.map((msg) =>
            messageIds.includes(msg._id) && msg.status !== "read"
              ? { ...msg, status: "read" }
              : msg
          )
        );
      }
    );

    // Typing status updates
    socketRef.current.on("msgstatus", (data) => {
      settypingstatus(data.typingstatus);
    });

    socketRef.current.on("updatestatus", fetchUsers);

    return () => {
      socketRef.current?.off("receivemsg");
      socketRef.current?.off("messageDelivered");
      socketRef.current?.off("messageRead");
      socketRef.current?.off("msgstatus");
      socketRef.current?.off("updatestatus");
      socketRef.current?.disconnect();
    };
  }, [activeroom]);

  // Join room on active room change
  useEffect(() => {
    if (activeroom?.roomId && socketRef.current) {
      socketRef.current.emit("joinroom", { roomId: activeroom.roomId });
      setmsgarray([...activeroom.messages]); // OK to set once
    }
  }, [activeroom?.roomId]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const agentstatus = users.filter(
      (user) => user.role === "Agent" && user.status === "Online"
    );
    setAgent(agentstatus);
  }, [users]);

  // Get rooms for this user
  const [room, setroom] = useState<Room[]>([]);
  useEffect(() => {
    const getrooom = async () => {
      const res = await axios.post("http://localhost:5000/getroombyuser", {
        username: localStorage.getItem("username"),
      });
      setroom(res.data.room);
    };
    getrooom();
  }, []);

  useEffect(() => {
    const newroom: Roomwithstatus[] = room.map((one) => ({
      ...one,
      status: agent.some((a) => a.fullname === one.agent) ? "Online" : "Offline",
    }));
    setroomwithstatus(newroom);
  }, [room, agent]);

  // Handle typing status changes & emit to server
  const handletypingstatus = (e: React.ChangeEvent<HTMLInputElement>): void => {
    settypingstatus(true);
    settextmsg(e.target.value);
    socketRef.current?.emit("typingstatus", {
      roomId: activeroom?.roomId,
      typingstatus: true,
    });
  };

  // Send message handler
  const sendmsg = () => {
    if (!textmsg.trim()) return; // prevent empty messages

    const newMessage: Messages = {
      _id: Math.random().toString(36).substring(2, 15), // temp unique id, backend should assign real _id ideally
      sender: localStorage.getItem("username") || "",
      text: textmsg,
      status: "sent",
      timestamp: new Date(),
    };

    socketRef.current?.emit("sendmessage", {
      roomId: activeroom?.roomId,
      sender: newMessage.sender,
      text: newMessage.text,
      status: newMessage.status,
      timestamp: newMessage.timestamp,
    });

    setmsgarray((prevMsgs) => [...prevMsgs, newMessage]); // update locally immediately

    settextmsg("");
    settypingstatus(false);

    socketRef.current?.emit("typingstatus", {
      roomId: activeroom?.roomId,
      typingstatus: false,
    });
  };

  // Emit messageRead for unread messages when activeroom or msgarray changes
  useEffect(() => {
    if (activeroom && msgarray.length > 0) {
      const unreadMessageIds = msgarray
        .filter(
          (msg) =>
            msg.status !== "read" &&
            msg.sender !== localStorage.getItem("username")
        )
        .map((msg) => msg._id);

      if (unreadMessageIds.length > 0) {
        socketRef.current?.emit("messageRead", {
          roomId: activeroom.roomId,
          messageIds: unreadMessageIds,
        });
      }
    }
  }, [activeroom, msgarray]);

  const handleOnlineAgent = () => {
    setAgentSelect(true);
  };

  const handleSelectedAgent = async (username: string, fullname: string) => {
    setAgentSelect(false);
    setActiveTab(fullname);
    try {
      const res = await axios.post("http://localhost:5000/registeredroom", {
        username: localStorage.getItem("username"),
        agent: fullname,
      });
      console.log("Room registered:", res.data);
    } catch (error) {
      console.error("Error registering room:", error);
    }
  };

  // Auto-scroll only if near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [msgarray]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-300">
      <div className="z-10 flex justify-between items-center h-[4rem] bg-white shadow-md">
        <p className="font-extrabold italic text-2xl text-pink-500">
          Chatter User{" "}
          <span className="font-thin inter text-3xl text-blue-500">DashBoard</span>
        </p>
      </div>

      <div className="flex flex-row h-[calc(100vh-4rem)]">
        <div className="flex flex-col mt-2 w-[30rem] bg-white p-4 overflow-y-auto">
          <p className="mb-4 font-light inter text-xl text-black">Chat History:</p>
          <div className="flex flex-col gap-3">
            {roomwithstatus.map((one, index) => {
              const initials: string = one.agent
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              const colorIndex =
                Math.abs(
                  one.agent
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
                ) % colors.length;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                      colors[colorIndex]
                    }`}
                  >
                    {initials}
                  </div>
                  <p
                    className={`text-lg font-medium px-2 py-1 rounded-md cursor-pointer transition-all duration-200 ${
                      activeTab === one.agent ? "bg-blue-300" : "hover:bg-blue-100"
                    }`}
                    onClick={() => {
                      setActiveTab(one.agent);
                      setactiveroom(one);
                      setmsgarray(one.messages);
                    }}
                  >
                    {one.agent}
                  </p>
                  <div
                    className={`flex justify-end mr-2 h-2 rounded-full w-2 ${
                      one.status === "Online" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="mt-2 ml-2 h-full w-full bg-white flex flex-col border border-gray-200 rounded-md shadow-md">
          {activeTab === "" ? (
            <p className="text-3xl flex justify-center items-center h-full">
              Connect with New Agent?{" "}
              <button
                className="bg-blue-500 rounded-md hover:bg-green-500 ml-2"
                onClick={handleOnlineAgent}
              >
                <p className="p-2 text-white cursor-pointer">Click Me</p>
              </button>
            </p>
          ) : (
            <>
              <div className="flex items-center h-[10%] w-full bg-white px-4 border-b border-gray-300">
                <p className="text-xl font-semibold italic">{activeTab}</p>
              </div>

              {/* Messages container: scrollable */}
              <div
                ref={messagesContainerRef}
                className="flex-1 bg-gray-100 overflow-y-auto px-4 py-2 space-y-2"
              >
                {activeroom !== null &&
                  msgarray.map((msg, index) => {
                    const isMe = msg.sender === localStorage.getItem("username");
                    return (
                      <div
                        key={index}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex flex-col max-w-xs">
                          <div
                            className={`px-4 py-2 rounded-lg shadow-sm ${
                              isMe
                                ? "bg-blue-500 text-white self-end"
                                : "bg-white text-black self-start"
                            }`}
                          >
                            {msg.text}
                          </div>
                          {isMe && (
                            <p className="text-xs text-gray-500 mt-1 self-end italic">
                              {msg.status === "sent" && "✓ Sent"}
                              {msg.status === "delivered" && "✓✓ Delivered"}
                              {msg.status === "read" && "✓✓ Seen"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Input bar fixed at bottom inside chat container */}
              <div className="flex items-center h-[10%] w-full bg-white px-4 border-t border-gray-300">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={textmsg}
                  className="flex-1 p-2 border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handletypingstatus}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendmsg();
                    }
                  }}
                />
                <button
                  className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  onClick={sendmsg}
                >
                  Send
                </button>
              </div>
            </>
          )}

          {agentSelect && (
            <div className="absolute flex flex-col h-1/2 w-1/2 mt-[5%] ml-[5%] bg-white rounded-lg shadow-lg p-4 z-50 border-2 border-blue-500">
              <div className="h-[10%] w-full mb-4">
                <p className="text-2xl font-bold text-black">Online Agents Available</p>
              </div>
              <div className="flex flex-col space-y-2 overflow-y-auto">
                {agent.map((one, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectedAgent(one.username, one.fullname)}
                    className={`cursor-pointer px-4 py-2 rounded-md transition-all ${
                      selectedAgent?.fullname === one.fullname
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-blue-100"
                    }`}
                  >
                    {one.fullname}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
