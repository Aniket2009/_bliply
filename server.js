const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve pages FIRST before static
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/chat", (req, res) => {
  res.sendFile(__dirname + "/public/chat.html");
});

app.get("/call", (req, res) => {
  res.sendFile(__dirname + "/public/call.html");
});

// Static files AFTER routes
app.use(express.static("public"));

// ✅ SINGLE socket connection handler
io.on("connection", (socket) => {
  // --- CHAT System ---
  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    socket.to(room).emit("chat message", `${username} joined the room`);

    socket.on("chat message", (msg) => {
      io.to(room).emit("chat message", `${username}: ${msg}`);
    });

    socket.on("disconnect", () => {
      socket.to(room).emit("chat message", `${username} left the room`);
    });
  });

  // --- VIDEO CALL System ---
  socket.on("join-call-room", ({ username, room }) => {
    socket.join(room);
    const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
    if (clients.length > 1) {
      socket.to(room).emit("ready-to-call");
    }
  });

  socket.on("offer", ({ offer, room }) => {
    socket.to(room).emit("offer", { offer });
  });

  socket.on("answer", ({ answer, room }) => {
    socket.to(room).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate, room }) => {
    socket.to(room).emit("ice-candidate", { candidate });
  });
});

// Server start
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Bliply running on all interfaces at http://0.0.0.0:${PORT}`);
});
