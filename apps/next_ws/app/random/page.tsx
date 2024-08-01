'use client'

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Response } from "@/types/ResponseType";
import { DataProps } from "@/types/SendingDataType";
import SingleChatSkeleton from "@/components/skeleton/SingleChatSkeleton";

export default function Page() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Response[]>([]);
  const [target, setTarget] = useState<string>("");
  const [text, setText] = useState<string>("");

  const { data: session } = useSession();
  const email = session?.user?.email;
  const person = session?.user?.name;

  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
    // const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    socket.onopen = () => {
      console.log("Connected to the server");
      socket.send(JSON.stringify({ type: "register", from: email }));
      setSocket(socket);
    }

    socket.onmessage = (message) => {
      const parsedMessage: Response = JSON.parse(message.data);
      setMessages((prev) => [
        ...prev,
        ...(parsedMessage instanceof Array ? parsedMessage : [parsedMessage])
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
      const data: DataProps = {
        type: "message",
        from: email!,
        person: person!,
        to: target,
        text
      }
      socket.send(JSON.stringify(data));
      setText("");
    }
  }

  if (!socket) {
    return <SingleChatSkeleton />
  }

  return (
    <div className="h-screen flex justify-center items-center">
      <div className="flex flex-col space-y-2">
        <p>
          Hi, <span className="text-sky-600">{person}</span>
        </p>
        <p>Send it to your friend to chat with him/her</p>
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="message"
            className="border border-gray-300 p-2 rounded-lg"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="text"
            placeholder="target email"
            className="border border-gray-300 p-2 rounded-lg"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <button onClick={handleSend} className="rounded-md bg-sky-500 border p-2 text-white">Send</button>
        </div>
        <div className="text-sm italic flex flex-col">
          {messages.length > 0 ? messages.map((data: Response, index: React.Key) => (
            <p key={index}><strong>{data.person}</strong>: {data.text}</p>
          )) : <p>No new messages...</p>}
        </div>
      </div>
    </div>
  )
}
