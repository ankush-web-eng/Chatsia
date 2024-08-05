import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url !== "/favicon.ico") {
    console.log(new Date() + " Received request for " + req.url);
    res.end("Hi there!");
  }
});

const wss = new WebSocketServer({ server });
const clients = new Map<string, { socket: WebSocket, lastPing: number, isAvailable: boolean }>();

const PING_INTERVAL = 10000;
const DISCONNECT_TIMEOUT = 30000;

wss.on('connection', (ws) => {
  ws.on('error', (error) => console.error('WebSocket error:', error));

  ws.on('message', (message, isBinary) => {
    try {
      const messageStr = message.toString();
      console.log(`Received message: ${messageStr}`);

      const parsedMessage = JSON.parse(messageStr);
      const { type, from, to, person, text, sdp, candidate } = parsedMessage;

      switch (type) {
        case 'register':
          handleRegister(ws, from, isBinary);
          break;
        case 'ping':
          handlePing(from);
          break;
        case 'initiateCall':
          handleCallInitiation(from, to, isBinary);
          break;
        case 'message':
          handleMessage(ws, from, to, person, text, isBinary);
          break;
        case 'createOffer':
        case 'createAnswer':
          handleSdpExchange(type, from, to, sdp, isBinary);
          break;
        case 'iceCandidate':
          handleIceCandidate(from, to, candidate, isBinary);
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
  if (!clients.has(from)) {
    clients.set(from, { socket: ws, lastPing: Date.now(), isAvailable: true });
  } else {
    const client = clients.get(from)!;
    client.socket = ws;
    client.lastPing = Date.now();
    client.isAvailable = true;
  }
  console.log(`Registered ${from}`);
  broadcastStatus();
  ws.send(JSON.stringify({ type: 'registerConfirmation', status: 'success' }), { binary: isBinary });
}

function handlePing(from: string) {
  if (clients.has(from)) {
    clients.get(from)!.lastPing = Date.now();
  }
}

function handleCallInitiation(from: string, to: string, isBinary: boolean) {
  const callerClient = clients.get(from);
  const receiverClient = clients.get(to);
  
  if (callerClient && receiverClient && receiverClient.isAvailable) {
    console.log(`${from} is calling ${to}`);
    receiverClient.socket.send(JSON.stringify({ type: 'incomingCall', from }), { binary: isBinary });
    callerClient.socket.send(JSON.stringify({ type: 'callInitiated', to }), { binary: isBinary });
  } else {
    console.log(`Call initiation failed: ${to} is not available`);
    callerClient?.socket.send(JSON.stringify({ type: 'callFailed', reason: 'Receiver not available' }), { binary: isBinary });
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

function handleSdpExchange(type: string, from: string, to: string, sdp: any, isBinary: boolean) {
  const targetClient = clients.get(to);
  if (targetClient) {
    console.log(`Sending ${type} from ${from} to ${to}`);
    targetClient.socket.send(JSON.stringify({ type, from, sdp }), { binary: isBinary });
  } else {
    console.log(`Invalid ${type} exchange: target client not found`);
  }
}

function handleIceCandidate(from: string, to: string, candidate: any, isBinary: boolean) {
  const targetClient = clients.get(to);
  if (targetClient) {
    console.log(`Sending ice candidate from ${from} to ${to}`);
    targetClient.socket.send(JSON.stringify({ type: 'iceCandidate', from, candidate }), { binary: isBinary });
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
  const onlineUsers = Array.from(clients.keys());
  for (let { socket } of clients.values()) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'updateStatus',
        users: onlineUsers
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