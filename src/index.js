const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

io.on("connection", (socket) => {
  console.log("socket is working");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("message", generateMessage('Admin',"Welcome!"));

    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage('Admin',`${user.username} has Joined!`));

      io.to(user.room).emit('roomData',{
        room:user.room,
        users:getUsersInRoom(user.room)
      })
    callback()
  });

  socket.on("nextChat", (message, callback) => {
    const user=getUser(socket.id)
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username,message));
    callback();
  });

  socket.on("sendLocation", (coords, callback) => {
    const user=getUser(socket.id)
    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username,coords));
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage('Admin',`${user.username} has Left!`)
     
      );
         io.to(user.room).emit("roomData", {
           room: user.room,
           users: getUsersInRoom(user.room),
         });
    }
  });
});

server.listen(port, () => {
  console.log("serving at port 3000");
});
