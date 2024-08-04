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
  ws.on('error', (error) => console.error('WebSocket error:', error));

  ws.on('message', (message, isBinary) => {
    try {
      const messageStr = message.toString();
      console.log(`Received message: ${messageStr}`);

      const parsedMessage = JSON.parse(messageStr);
      const { type, from, person, to, text, sdp, candidate } = parsedMessage;

      switch (type) {
        case 'register':
          handleRegister(ws, from, isBinary);
          break;
        case 'ping':
          handlePing(from);
          break;
        case 'message':
          handleMessage(ws, from, to, person, text, isBinary);
          break;
        case 'sender':
          handleSender(from, to, isBinary);
          break;
        case 'receiver':
          handleReceiver(from, to, isBinary);
          break;
        case 'createOffer':
        case 'createAnswer':
          handleSdpExchange(type, from, to, sdp, isBinary);
          break;
        case 'iceCandidate':
          handleIceCandidate(from, to, candidate, isBinary);
          break;
        case 'videoSender':
          handleVideoSender(ws);
          break;
        case 'videoReceiver':
          handleVideoReceiver(ws);
          break;
        case 'videoCreateOffer':
          handleVideoCreateOffer(ws, sdp);
          break;
        case 'videoCreateAnswer':
          handleVideoCreateAnswer(ws, sdp);
          break;
        case 'videoIceCandidate':
          handleVideoIceCandidate(ws, candidate);
          break;
        default:
          console.log(`Unhandled message type: ${type}`);
      }
    } catch (error) {
      console.error(`Error parsing message: ${message}`, error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });
});

function handleRegister(ws: WebSocket, from: string, isBinary: boolean) {
  clients.set(from, { socket: ws, lastPing: Date.now() });
  broadcastStatus();
  ws.send(JSON.stringify({ type: 'receiverStatus', status: 'online' }), { binary: isBinary });
}

function handlePing(from: string) {
  if (clients.has(from)) {
    clients.get(from)!.lastPing = Date.now();
  }
}

function handleMessage(ws: WebSocket, from: string, to: string, person: string, text: string, isBinary: boolean) {
  const targetClient = clients.get(to);
  if (targetClient) {
    const fullMessage = { type: 'message', person, text, from };
    targetClient.socket.send(JSON.stringify(fullMessage), { binary: isBinary });
    ws.send(JSON.stringify(fullMessage), { binary: isBinary });
  }
}

function handleSender(from: string, to: string, isBinary: boolean) {
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

function handleReceiver(from: string, to: string, isBinary: boolean) {
  if (from && activeCalls.has(to) && activeCalls.get(to) === from) {
    const senderSocket = clients.get(to)?.socket;
    if (senderSocket) {
      senderSocket.send(JSON.stringify({ type: 'callAccepted', from }), { binary: isBinary });
    }
  }
}

function handleSdpExchange(type: string, from: string, to: string, sdp: any, isBinary: boolean) {
  const isValidCall = (type === 'createOffer' && activeCalls.has(from) && activeCalls.get(from) === to) ||
                      (type === 'createAnswer' && activeCalls.has(to) && activeCalls.get(to) === from);

  if (isValidCall) {
    const targetSocket = clients.get(to)?.socket;
    if (targetSocket) {
      targetSocket.send(JSON.stringify({ type, sdp }), { binary: isBinary });
    }
  }
}

function handleIceCandidate(from: string, to: string, candidate: any, isBinary: boolean) {
  const isValidCall = (activeCalls.has(from) && activeCalls.get(from) === to) ||
                      (activeCalls.has(to) && activeCalls.get(to) === from);

  if (isValidCall) {
    const targetSocket = clients.get(to)?.socket;
    if (targetSocket) {
      targetSocket.send(JSON.stringify({ type: 'iceCandidate', candidate }), { binary: isBinary });
    }
  }
}

function handleVideoSender(ws: WebSocket) {
  console.log("sender added");
  senderSocket = ws;
}

function handleVideoReceiver(ws: WebSocket) {
  console.log("receiver added");
  receiverSocket = ws;
}

function handleVideoCreateOffer(ws: WebSocket, sdp: any) {
  if (ws !== senderSocket) return;
  console.log("sending offer");
  receiverSocket?.send(JSON.stringify({ type: 'videoCreateOffer', sdp: sdp }));
}

function handleVideoCreateAnswer(ws: WebSocket, sdp: any) {
  if (ws !== receiverSocket) return;
  console.log("sending answer");
  senderSocket?.send(JSON.stringify({ type: 'videoCreateAnswer', sdp: sdp }));
}

function handleVideoIceCandidate(ws: WebSocket, candidate: any) {
  console.log("sending ice candidate");
  if (ws === senderSocket) {
    console.log("sender ice candidate");
    receiverSocket?.send(JSON.stringify({ type: 'videoIceCandidate', candidate: candidate }));
  } else if (ws === receiverSocket) {
    console.log("receiver ice candidate");
    senderSocket?.send(JSON.stringify({ type: 'videoIceCandidate', candidate: candidate }));
  }
}

function handleDisconnect(ws: WebSocket) {
  for (let [username, client] of clients.entries()) {
    if (client.socket === ws) {
      clients.delete(username);
      console.log(`User disconnected: ${username}`);
      broadcastStatus();
      break;
    }
  }
}

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