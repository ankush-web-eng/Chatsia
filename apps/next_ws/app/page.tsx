"use client"

import { useEffect, useState } from "react";

type dataProps = {
  from: string;
  to: string;
  text: string;
  person: string;
}

export default function Page() {

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<dataProps[]>([]);
  const [person, setPerson] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const randomUsername = generateRandomUsername();
    setUsername(randomUsername);

    const socket = new WebSocket("wss://ws-app-hzox.onrender.com/");
    // const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Connected to the server");
      socket.send(JSON.stringify({ type: "register", username: randomUsername }));
      setSocket(socket);
    }

    socket.onmessage = (message) => {
      const parsedMessage: dataProps = JSON.parse(message.data);
      setMessages((prev) => [
        ...prev,
        parsedMessage
      ]);
    }

    socket.onclose = () => {
      console.log("Disconnected from the server");
    }

    return () => {
      socket.close();
    }
  }, []);

  const generateRandomUsername = () => {
    return Math.random().toString(36).substring(2, 8);
  }

  const handleSend = () => {
    if (socket) {
      const data = {
        type: "message",
        from: username,
        to: target,
        person,
        text
      }
      socket.send(JSON.stringify(data));
      setText("");
    }
  }

  if (!socket) {
    return <div>
      Connecting to the server...
    </div>
  }

  return (
    <div className="h-screen flex justify-center items-center">
      <div className="flex flex-col space-y-2">
        <p>
          Your username is <span className="text-sky-600">{username}</span>
        </p>
        <p>Send it to your friend to chat with him/her</p>
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="your name"
            className="border border-gray-300 p-2 rounded-lg"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
          />
          <input
            type="text"
            placeholder="message"
            className="border border-gray-300 p-2 rounded-lg"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="text"
            placeholder="target username"
            className="border border-gray-300 p-2 rounded-lg"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <button onClick={handleSend} className="rounded-md bg-sky-500 border p-2 text-white">Send</button>
        </div>
        <div className="text-sm italic flex flex-col">
          {messages.length > 0 ? messages.map((data: dataProps, index) => (
            <p key={index}>{data.person} : {data.text}</p>
          )) : <p>Loading Messages...</p>}
        </div>
      </div>
    </div>
  )
}
