"use client"

import { useEffect, useState } from "react";

type dataProps = {
  person: string;
  text: string;
}

export default function Page() {

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<dataProps[]>([]);
  const [person, setPerson] = useState<string>("Ankush");
  const [text, setText] = useState<string>("");

  const data = {
    person,
    text
  }

  useEffect(() => {
    const socket = new WebSocket("wss://ws-app-hzox.onrender.com/");

    socket.onopen = () => {
      console.log("Connected to the server");
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

  const handleSend = () => {
    if (socket) {
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
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="name"
            className="border border-gray-300 p-2"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
          />
          <input
            type="text"
            placeholder="message"
            className="border border-gray-300 p-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
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
