import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';


const server = http.createServer((req, res) => {
  if (req.url !== "/favicon.ico") {
    console.log(new Date() + " Received request for " + req.url);
    res.end("Hi there!");
  }
});


const wss = new WebSocketServer({ server });
const clients = new Map<string, WebSocket>();

let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;

wss.on('connection', (ws) => {
  ws.on('error', (error) => console.error(error));

  ws.on('message', (message, isBinary) => {
    try {
      const messageStr = message.toString();
      console.log(`Received message: ${messageStr}`);

      const parsedMessage = JSON.parse(messageStr);
      const { type, from, person, to, text, sdp, candidate } = parsedMessage;

      if (type === 'register') {
        clients.set(from, ws);
        console.log(`User registered: ${from}`);

        let status = 'offline';
        const targetClient = clients.get(to);
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          status = 'online';
        }

        ws.send(JSON.stringify({ type: 'receiverStatus', status }), { binary: isBinary });
      }

      else if (type === 'message' && to) {
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

      else if (type === 'sender') {
        senderSocket = ws;
        console.log(`Sender identified`);
      }
      else if (type === 'receiver') {
        receiverSocket = ws;
        console.log(`Receiver identified`);
      }
      else if (type === 'createOffer') {
        if (ws !== senderSocket) return;
        console.log("Sending offer");
        receiverSocket?.send(JSON.stringify({ type: 'createOffer', sdp }));
      }
      else if (type === 'createAnswer') {
        if (ws !== receiverSocket) return;
        console.log("Sending answer");
        senderSocket?.send(JSON.stringify({ type: 'createAnswer', sdp }));
      }

      else if (type === 'iceCandidate') {
        console.log("Sending ICE candidate");
        if (ws === senderSocket) {
          receiverSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate }));
        } else if (ws === receiverSocket) {
          senderSocket?.send(JSON.stringify({ type: 'iceCandidate', candidate }));
        }
      }


    } catch (error) {
      console.error(`Error parsing message: ${message}`, error);
    }
  });


  ws.on('close', () => {
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
