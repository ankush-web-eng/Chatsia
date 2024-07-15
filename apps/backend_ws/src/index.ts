import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer((req, res) => {
    if (req.url !== "/favicon.ico") {
        console.log(new Date() + " Received request for " + req.url);
        res.end("Hi there!");
    }
});

const wss = new WebSocketServer({ server });
const clients = new Map(); // Map to store username to WebSocket mapping

wss.on("connection", (ws) => {
    ws.on("error", (error) => console.error(error));

    ws.on("message", (message, isBinary) => {
        try {
            const messageStr = message.toString(); // Convert RawData to string
            console.log(`Received message: ${messageStr}`);
            const parsedMessage = JSON.parse(messageStr);
            const { type, username, from, to, text, person } = parsedMessage;

            if (type === "register") {
                // Register the username with the WebSocket connection
                clients.set(username, ws);
                console.log(`User registered: ${username}`);
            } else if (type === "message" && to) {
                // Send the message to the target user
                const targetClient = clients.get(to);
                if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                    targetClient.send(JSON.stringify({ from, to, text, person }), { binary: isBinary });
                    console.log(`Message from ${from} to ${to}: ${text}`);
                } else {
                    console.log(`User ${to} not found or not connected.`);
                }
            }
        } catch (error) {
            console.error(`Error parsing message: ${message}`, error);
        }
    });

    ws.on("close", () => {
        // Remove the disconnected user from the clients map
        for (let [username, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(username);
                console.log(`User disconnected: ${username}`);
                break;
            }
        }
    });
});

server.listen(3001, () => {
    console.log("Server started on http://localhost:3001");
});
