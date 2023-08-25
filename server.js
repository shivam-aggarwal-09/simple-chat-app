const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server)
let onlineUsers = [];

function replaceWordsWithEmojis(text) {
    const emojiMap = {
        "react": "⚛️",
        "woah": "😲",
        "hey": "👋",
        "lol": "😂",
        "like": "❤️",
        "congratulations": "🎉"
    };

    for (let word in emojiMap) {
        let regex = new RegExp(`\\b${word}\\b`, "gi");
        text = text.replace(regex, emojiMap[word]);
    }

    return text;
}


app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.use((req, res, next) => {
    console.log(`Request for: ${req.url}`);
    next();
});

io.on('connection', (socket) => {
    console.log('a user connected');



    socket.on('user joined', (name) => {
        if (onlineUsers.includes(name)) {
            // Emit a custom event back to the user that the username is taken
            socket.emit('username taken');
            return; // Exit out of the function
        }

        socket.userName = name;
        onlineUsers.push(name);
        io.emit('update user list', onlineUsers);
        io.emit('user joined notification', `${name} has joined the chat`);
        console.log(`Incoming username: ${name}`)
    });
    
    socket.on('chat message', (msg) => {
        console.log("Received message:", msg); // Debug log
      
        msg = replaceWordsWithEmojis(msg); // Convert words to emojis
    
        console.log("Message after emoji conversion:", msg); // Debug log
    
        io.emit('chat message', msg); // Broadcast the message
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
});


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
