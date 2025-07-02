# Real-Time-Role-Based-Chat-Support-System
This project is a real-time messaging web application designed for efficient communication between Users, Support Agents, and Administrators. Built using React (frontend) and Node.js with Socket.IO (backend), the system supports live chat, typing indicators, message delivery/read tracking, and role-based access control.

The app is ideal for use cases like customer support platforms, helpdesks, and internal communication tools.

✅ Key Features:
🔌 Real-Time Messaging (Socket.IO)
Bi-directional communication between users and agents without page reloads

Instant message delivery with broadcast capabilities

Room-based architecture for isolated 1:1 chats

👤 Role-Based Authentication (No JWT)
Supports three roles: User, Agent, and Admin

Role assigned at registration

Backend-controlled access for each role’s functionality

✍️ Typing Indicators
Live “User is typing…” message using socket broadcast

Visible in real-time to the connected chat room

📶 User Presence (Online/Offline Status)
Tracks online/offline status using Socket.IO

Admin dashboard reflects real-time presence of users and agents

Auto-updates on disconnect or logout

📥 Message Status
Supports sent, delivered, and read status

Updates are broadcast via sockets for real-time accuracy

🗃 Chat History & Storage
Messages are stored in MongoDB using Mongoose

Message schema includes sender, text, timestamp, and status

⚡ Redis Caching
Implements Redis to cache recent messages for faster retrieval

Optimizes chat performance by reducing DB calls

🛠️ Admin Dashboard
Shows real-time list of users and agents with status

Allows assigning agents to unassigned chat rooms

Supports exporting chat history (JSON/CSV)

🧰 Tech Stack:
Layer	Tech
Frontend	React + TypeScript + Tailwind CSS
Backend	Node.js + Express + Socket.IO
Database	MongoDB + Mongoose
Caching	Redis
Real-time Comm	Socket.IO
Auth	Role-based (without JWT for simplicity)
