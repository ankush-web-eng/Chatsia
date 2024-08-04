import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url !== "/favicon.ico") {
    console.log(new Date() + " Received request for " + req.url);
    res.end("Hi there!");
  }
});

const wss = new WebSocketServer({ server });
const clients = new Map<string, { socket: WebSocket, lastPing: number }>();
const activeCalls = new Map<string, string>();

const PING_INTERVAL = 10000;
const DISCONNECT_TIMEOUT = 30000;

let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

wss.on('connection', (ws) => {
  ws.on('error', (error) => console.error(error));

  ws.on('message', (message, isBinary) => {
    try {
      const messageStr = message.toString();
      console.log(`Received message: ${messageStr}`);

      const parsedMessage = JSON.parse(messageStr);
      const { type, from, person, to, text, sdp, candidate } = parsedMessage;

      if (type === 'register') {
        clients.set(from, { socket: ws, lastPing: Date.now() });

        broadcastStatus();

        ws.send(JSON.stringify({ type: 'receiverStatus', status: 'online' }), { binary: isBinary });
      }

      else if (type === 'ping') {
        if (clients.has(from)) {
          clients.get(from)!.lastPing = Date.now();
        }
      }

      else if (type === 'message' && to) {
        const targetClient = clients.get(to);
        if (targetClient) {
          const fullMessage = { person, text, from };
          targetClient.socket.send(JSON.stringify(fullMessage), { binary: isBinary });
          ws.send(JSON.stringify(fullMessage), { binary: isBinary });
        }
      }

      else if (type === 'sender') {
        if (from && to && from !== to && clients.has(to)) {
          activeCalls.set(from, to);
          console.log(`Sender ${from} calling ${to}`);
          const receiverSocket = clients.get(to)?.socket;
          if (receiverSocket) {
            receiverSocket.send(JSON.stringify({ type: 'incomingCall', from }), { binary: isBinary });
          }
        } else {
          console.log(`Invalid sender or receiver.`);
        }
      }

      else if (type === 'receiver' && from && activeCalls.has(to) && activeCalls.get(to) === from) {
        const senderSocket = clients.get(to)?.socket;
        if (senderSocket) {
          senderSocket.send(JSON.stringify({ type: 'callAccepted', from }), { binary: isBinary });
        }
      }

      else if (type === 'createOffer') {
        if (activeCalls.has(from) && activeCalls.get(from) === to) {
          const receiverSocket = clients.get(to)?.socket;
          if (receiverSocket) {
            receiverSocket.send(JSON.stringify({ type: 'createOffer', sdp }), { binary: isBinary });
          }
        }
      }

      else if (type === 'createAnswer') {
        if (activeCalls.has(to) && activeCalls.get(to) === from) {
          const senderSocket = clients.get(to)?.socket;
          if (senderSocket) {
            senderSocket.send(JSON.stringify({ type: 'createAnswer', sdp }), { binary: isBinary });
          }
        }
      }

      else if (type === 'iceCandidate') {
        if (activeCalls.has(from) && activeCalls.get(from) === to) {
          const receiverSocket = clients.get(to)?.socket;
          if (receiverSocket) {
            receiverSocket.send(JSON.stringify({ type: 'iceCandidate', candidate }), { binary: isBinary });
          }
        } else if (activeCalls.has(to) && activeCalls.get(to) === from) {
          const senderSocket = clients.get(to)?.socket;
          if (senderSocket) {
            senderSocket.send(JSON.stringify({ type: 'iceCandidate', candidate }), { binary: isBinary });
          }
        }
      }


      else if (type === 'videoSender') {
        console.log("sender added");
        senderSocket = ws;
      } else if (type === 'videoReceiver') {
        console.log("receiver added");
        receiverSocket = ws;
      } else if (type === 'videoCreateOffer') {
        if (ws !== senderSocket) {
          return;
        }
        console.log("sending offer");
        receiverSocket?.send(JSON.stringify({ type: 'videoCreateOffer', sdp: sdp }));
      } else if (type === 'videoCreateAnswer') {
        if (ws !== receiverSocket) {
          return;
        }
        console.log("sending answer");
        senderSocket?.send(JSON.stringify({ type: 'videoCreateAnswer', sdp: sdp }));
      } else if (type === 'iceCandidate') {
        console.log("sending ice candidate")
        if (ws === senderSocket) {
          console.log("sender ice candidate");
          receiverSocket?.send(JSON.stringify({ type: 'videoIceCandidate', candidate: candidate }));
        } else if (ws === receiverSocket) {
          console.log("receiver ice candidate");
          senderSocket?.send(JSON.stringify({ type: 'videoIceCandidate', candidate: candidate }));
        }
      }


    } catch (error) {
      console.error(`Error parsing message: ${message}`, error);
    }
  });

  ws.on('close', () => {
    for (let [username, client] of clients.entries()) {
      if (client.socket === ws) {
        clients.delete(username);
        console.log(`User disconnected: ${username}`);
        broadcastStatus();
        break;
      }
    }
  });
});

function broadcastStatus() {
  for (let [username, { socket }] of clients.entries()) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'updateStatus',
        users: Array.from(clients.keys())
      }));
    }
  }
}

setInterval(() => {
  const now = Date.now();
  for (let [username, client] of clients.entries()) {
    if (now - client.lastPing > DISCONNECT_TIMEOUT) {
      clients.delete(username);
      console.log(`User timed out: ${username}`);
      client.socket.close();
    }
  }
  broadcastStatus();
}, PING_INTERVAL);

server.listen(3001, () => {
  console.log("Server started on http://localhost:3001");
});
