import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer((req, res) => {
    if (req.url !== "/favicon.ico") {
        console.log(new Date() + " Received request for " + req.url);
        res.end("Hi there!");
    }
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    ws.on("error", error => console.error(error))

    ws.on("message", (data, isBinary) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: isBinary });
                console.log(data.toString())
            }
        })
    })
})

server.listen(3001, () => {
    console.log("Server started on http://localhost:3001");
})