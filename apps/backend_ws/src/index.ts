import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer((req, res) => {
  if (req.url !== "/favicon.ico") {
    console.log(new Date() + " Received request for " + req.url);
    res.end("Hi there!");
  }
});

const wss = new WebSocketServer({ server });
const clients = new Map();

wss.on("connection", (ws) => {
  ws.on("error", (error) => console.error(error));
  ws.on("message", (message, isBinary) => {
    try {
      const messageStr = message.toString();
      console.log(`Received message: ${messageStr}`);
      const parsedMessage = JSON.parse(messageStr);
      const { type, from, person, to, text } = parsedMessage;

      if (type === "register") {
        clients.set(from, ws);
        console.log(`User registered: ${from}`);
      } else if (type === "message" && to) {
        const targetClient = clients.get(to);
        if (targetClient) {
          const fullMessage = { person, text, from };
          targetClient.send(JSON.stringify(fullMessage), { binary: isBinary });
          ws.send(JSON.stringify(fullMessage), { binary: isBinary });
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
