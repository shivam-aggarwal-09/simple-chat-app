const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server)
let onlineUsers = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('user joined', (name) => {
        socket.userName = name; // Store the user's name on their socket session for later use
        if (!onlineUsers.includes(name)) {
            onlineUsers.push(name);
        }
        io.emit('update user list', onlineUsers);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        const disconnectedUser = socket.userName; // Retrieve the user's name from the socket session
        if (disconnectedUser) {
            onlineUsers = onlineUsers.filter(user => user !== disconnectedUser);
            io.emit('update user list', onlineUsers);
            io.emit('user left', `${disconnectedUser} has left the chat`);
        }
    });

    socket.on('user joined', (name) => {
        socket.userName = name;
        if (!onlineUsers.includes(name)) {
            onlineUsers.push(name);
        }
        io.emit('update user list', onlineUsers);
        
        io.emit('user joined notification', `${name} has joined the chat`);  // Emitting the user joined notification
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
