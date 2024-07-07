import { useEffect, useState } from "react";

export default function App() {

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Connected to the server");
      setSocket(socket);
    }

    socket.onmessage = (message) => {
      console.log("Message from the server: ", message.data);
      setMessages([...messages, message.data]);
    }

    socket.onclose = () => {
      console.log("Disconnected from the server");
    }

    return (() => {
      socket.close();
    })

  }, [])

  if (!socket) {
    return <div>
      Connecting to the server...
    </div>
  }

  return (
    <div className="h-screen flex justify-center items-center">
      <h1 className="text-4xl">{messages !== null ? messages.map(() => (
        <p>{messages}</p>
      )) : <p>Loading Messags...</p>}</h1>
      {/* <h1>{messages}</h1> */}
    </div>
  )
}
