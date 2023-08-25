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

function handleSlashCommand(msg, socket) {
    console.log("Handling slash command:", msg);
    const userName = socket.userName;
    const command = msg.split(' ')[0];
   
    switch (command) {
        case '/help':
            console.log("Handling /help command");
            const helpMessage = '/help - Show this message\n/random - Print a random number\n/clear - Clear the chat';
            socket.emit('display warning', helpMessage)
            break;

        case '/random':
            console.log("Handling /random command");
            const randomNumber = Math.floor(Math.random() * 100); // Random number between 0 and 99
            socket.emit('chat message', `${userName}: Random Number - ${randomNumber}`);
            break;

        case '/clear':
            console.log("Handling /clear command");
            socket.emit('clear chat');
            break;

        default:
            socket.emit('chat message', 'Unknown command');
    }
}

let onlineCount = 0

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
        if (!name || name.trim() === "") return;
        if (onlineUsers.includes(name)) {
            // Emit a custom event back to the user that the username is taken
            socket.emit('username taken');
            return; // Exit out of the function
        }

        socket.userName = name;
        onlineUsers.push(name);
        io.emit('update user list', onlineUsers);
        io.emit('user joined notification', `${name} has joined the chat`);
        io.emit('updateOnlineCount', onlineUsers.length);
        console.log(`Incoming username: ${name}`);
    });

    socket.on('chat message', (msg) => {
        console.log("Received message:", msg); // Debug log

        const messageContent = msg.split(':').slice(1).join(':').trim();

        if (messageContent.startsWith('/')) {
            console.log("Detected a slash command:", messageContent)
            handleSlashCommand(messageContent, socket);
            return;
        }

        msg = replaceWordsWithEmojis(msg); // Convert words to emojis

        console.log("Message after emoji conversion:", msg); // Debug log

        io.emit('chat message', msg); // Broadcast the message
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        const disconnectedUser = socket.userName; // Retrieve the user's name from the socket session
        if (disconnectedUser && onlineUsers.includes(disconnectedUser)) {
            onlineUsers = onlineUsers.filter(user => user !== disconnectedUser);
            io.emit('update user list', onlineUsers);
            io.emit('user left', `${disconnectedUser} has left the chat`);
            io.emit('updateOnlineCount', onlineUsers.length);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
