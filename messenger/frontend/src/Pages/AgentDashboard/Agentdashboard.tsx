import React, { useState, useEffect, useRef } from "react";
import { AiFillNotification } from "react-icons/ai";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { FaUser } from "react-icons/fa";

type User = {
  username: string;
  fullname: string;
  status: string;
  role: string;
};

type Messages = {
  _id: string;          // MongoDB message id
  sender: string;
  text: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
};

type Room = {
  user: string;
  agent: string;
  roomId: string;
  messages: Messages[];
};

type RoomWithStatus = Room & { status: string };

export default function AgentDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [userSelect, setUserSelect] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [roomWithStatus, setRoomWithStatus] = useState<RoomWithStatus[]>([]);
  const [room, setRoom] = useState<Room[]>([]);
  const [activeroom, setactiveroom] = useState<RoomWithStatus | null>(null);
  const [sendertypingstatus, setsendertypingstatus] = useState<boolean>(false);
  const [textmsg, settextmsg] = useState<string>("");
  const [typingstatus, settypingstatus] = useState<boolean>(false);
  const [msgarray, setmsgarray] = useState<Messages[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null); // NEW

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

  // Initialize socket and listeners
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      const username = localStorage.getItem("username");
      if (username) {
        socketRef.current?.emit("userOnline", username);
      }
    });

    socketRef.current.on("receivemsg", (newMessage: Messages) => {
      setmsgarray((prevMsgs) => [...prevMsgs, newMessage]);

      socketRef.current?.emit("messageDelivered", {
        roomId: activeroom?.roomId,
        messageId: newMessage._id,
      });
    });

    socketRef.current.on("messageDelivered", ({ messageId }: { messageId: string }) => {
      setmsgarray((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg._id === messageId && msg.status === "sent"
            ? { ...msg, status: "delivered" }
            : msg
        )
      );
    });

    socketRef.current.on("messageRead", ({ messageIds }: { messageIds: string[] }) => {
      setmsgarray((prevMsgs) =>
        prevMsgs.map((msg) =>
          messageIds.includes(msg._id) && msg.status !== "read"
            ? { ...msg, status: "read" }
            : msg
        )
      );
    });

    socketRef.current.on("msgstatus", (data) => {
      setsendertypingstatus(data.typingstatus);
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
      setmsgarray([...activeroom.messages]); // Load messages for active room
    }
  }, [activeroom?.roomId]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const online = users.filter((u) => u.role === "User" && u.status === "Online");
    setOnlineUsers(online);
  }, [users]);

  useEffect(() => {
    const getRoom = async () => {
      const res = await axios.post("http://localhost:5000/getroombyagent", {
        username: localStorage.getItem("username"),
      });
      setRoom(res.data.room);
    };
    getRoom();
  }, []);

  useEffect(() => {
    const updatedRooms: RoomWithStatus[] = room.map((r) => ({
      ...r,
      status: onlineUsers.some((u) => u.fullname === r.user) ? "Online" : "Offline",
    }));
    setRoomWithStatus(updatedRooms);
  }, [room, onlineUsers]);

  // Emit typing status on input change
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
    if (!textmsg.trim()) return;

    const newMessage: Messages = {
      _id: Math.random().toString(36).substring(2, 15),
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

    setmsgarray((prevMsgs) => [...prevMsgs, newMessage]);

    settextmsg("");
    settypingstatus(false);

    socketRef.current?.emit("typingstatus", {
      roomId: activeroom?.roomId,
      typingstatus: false,
    });
  };

  // Emit messageRead event when opening chat or when msgarray changes
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

  const handleOnlineUser = () => {
    setUserSelect(true);
  };

  const handleSelectedUser = async (username: string, fullname: string) => {
    setUserSelect(false);
    setActiveTab(fullname);

    try {
      await axios.post("http://localhost:5000/registeredroom", {
        username: localStorage.getItem("username"),
        agent: fullname,
      });
    } catch (error) {
      console.error("Error registering room:", error);
    }
  };

  // === AUTO SCROLL: Scroll to bottom only if user is near bottom ===
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
    // else do nothing so user reading older msgs won't be scrolled down
  }, [msgarray]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-300">
      <div className="z-10 flex justify-between items-center h-[4rem] bg-white shadow-md">
        <p className="font-extrabold italic text-2xl text-pink-500">
          Chatter Agent{" "}
          <span className="font-thin text-3xl text-blue-500">Dashboard</span>
        </p>
        <button className="relative mr-5 text-3xl text-gray-700 hover:text-blue-500">
          <AiFillNotification />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            3
          </span>
        </button>
      </div>

      <div className="flex flex-row">
        <div className="flex flex-col mt-2 w-[30rem] h-[40rem] bg-white p-4">
          <p className="mb-4 font-light text-xl text-black">Chat History:</p>
          <div className="flex flex-col gap-3 overflow-y-auto h-[calc(100%-2rem)]">
            {roomWithStatus.map((r, index) => {
              const initials = r.user
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              const colorIndex =
                Math.abs(
                  r.agent
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
                ) % colors.length;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${colors[colorIndex]}`}
                  >
                    {initials}
                  </div>
                  <p
                    className={`text-lg font-medium px-2 py-1 rounded-md cursor-pointer transition-all duration-200 ${
                      activeTab === r.user ? "bg-blue-300" : "hover:bg-blue-100"
                    }`}
                    onClick={() => {
                      setActiveTab(r.user);
                      setactiveroom(r);
                      setmsgarray(r.messages);
                    }}
                  >
                    {r.user}
                  </p>
                  <div
                    className={`flex justify-end mr-2 h-2 rounded-full w-2 ${
                      r.status === "Online" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 ml-2 h-[40rem] w-full bg-white flex flex-col border border-gray-200 rounded-md shadow-md">
          {activeTab === "" ? (
            <p className="text-3xl flex flex-row items-center justify-center flex-grow">
              Select Any Users to Talk
              <FaUser className="text-8xl ml-3" />
            </p>
          ) : (
            <>
              <div className="flex items-center h-[10%] w-full bg-white px-4 border-b border-gray-300">
                <p className="text-xl font-semibold italic">{activeTab}</p>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 bg-gray-100 overflow-y-auto px-4 py-2 space-y-2"
              >
                {activeroom &&
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
                {sendertypingstatus && (
                  <p className="italic text-sm text-gray-600 px-2">Typing...</p>
                )}
              </div>

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

          {userSelect && (
            <div className="absolute flex flex-col h-1/2 w-1/2 mt-[5%] ml-[5%] bg-white rounded-lg shadow-lg p-4 z-50 border-2 border-blue-500">
              <div className="h-[10%] w-full mb-4">
                <p className="text-2xl font-bold text-black">Online Users Available</p>
              </div>
              <div className="flex flex-col space-y-2 overflow-y-auto">
                {onlineUsers.map((one, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectedUser(one.username, one.fullname)}
                    className={`cursor-pointer px-4 py-2 rounded-md transition-all ${
                      selectedUser?.fullname === one.fullname
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
