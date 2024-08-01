'use client'
import Image from 'next/image';
import React, { useState, useEffect, KeyboardEvent } from 'react';

import { User as UserModel } from '@prisma/client';

import { FaVideo, FaPhone } from 'react-icons/fa';
import { IoIosSend } from 'react-icons/io';
import { useSession } from 'next-auth/react';
import { DataProps } from '@/types/SendingDataType';
import { Response } from '@/types/ResponseType';

const ChatInterface = ({ user }: { user: UserModel }) => {

    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [text, setText] = useState<string>("");
    const [isTyped, setIsTyped] = useState<boolean>(false);
    const [messages, setMessages] = useState<Response[]>([]);
    const { data: session } = useSession();

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);

        socket.onopen = () => {
            console.log("Connected to the server");
            socket.send(JSON.stringify({ type: "register", from: session?.user?.email }));
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

    useEffect(() => {
        setIsTyped(text.trim().length > 0);
    }, [text]);

    const handleSendMessage = () => {
        if (socket && isTyped) {
            const data: DataProps = {
                type: "message",
                from: session?.user?.email!,
                person: session?.user?.name!,
                to: user.email,
                text
            }
            socket.send(JSON.stringify(data));
            setText("");
        }
    }

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    }

    return (
        <div className="flex flex-col max-h-screen w-full">
            <div className="flex items-center rounded-xl justify-between p-3 border">
                <div className="flex items-center">
                    <Image
                        className="w-10 h-10 bg-yellow-500 rounded-full mr-3"
                        src={user.image!}
                        alt={user.name}
                        width={40}
                        height={40}
                        fetchPriority='high'
                        loading='lazy'
                    />
                    <span className="font-semibold">{user.name}</span>
                </div>
                <div className="flex space-x-4">
                    <FaVideo className="text-[#aebac1] text-xl" />
                    <FaPhone className="text-[#aebac1] text-xl" />
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {socket && messages.length > 0 ? messages.map((data: Response, index: React.Key) => (
                    <div
                        key={index}
                        className={`flex ${data.from === session?.user?.email ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] p-2 rounded-lg ${data.from === session?.user?.email
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-black'
                                }`}
                        >
                            <p><strong>{data.person}</strong>: {data.text}</p>
                        </div>
                    </div>
                )) : <p>No new messages...</p>}
            </div>

            {/* Chat Input Area */}
            <div className="p-3 flex items-center border-t">
                <input
                    type="text"
                    placeholder="Type a message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-grow border p-2 rounded-lg text-black"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!isTyped}
                    className={`text-xl ml-2 ${isTyped ? 'text-blue-500' : 'text-gray-500 cursor-not-allowed'}`}
                >
                    <IoIosSend />
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;