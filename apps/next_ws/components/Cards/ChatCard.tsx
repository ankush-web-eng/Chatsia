'use client'
import axios from 'axios';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect, KeyboardEvent } from 'react';

import { User as UserModel } from '@prisma/client';
import { Messages as Texts } from '@prisma/client';

import { Response } from '@/types/ResponseType';
import { DataProps } from '@/types/SendingDataType';
import { useToast } from '@/components/ui/use-toast';

import { IoIosSend } from 'react-icons/io';
import { FaVideo, FaPhone } from 'react-icons/fa';

const ChatInterface = ({ user }: { user: UserModel }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [text, setText] = useState<string>("");
    const [isTyped, setIsTyped] = useState<boolean>(false);
    const [dbMessages, setDbMessages] = useState<Texts[]>([]);
    const [socketMessages, setSocketMessages] = useState<Response[]>([]);
    const { data: session } = useSession();
    const { toast } = useToast();

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "register", from: session?.user?.email }));
            setSocket(socket);
        }

        socket.onmessage = (message) => {
            const parsedMessage: Response = JSON.parse(message.data);
            setSocketMessages((prev) => [...prev, parsedMessage]);
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

    const handleSaveMessage = async () => {
        try {
            await axios.post('/api/text/create', {
                text, reciever: user.email, sender: session?.user?.email, person: session?.user?.name
            });
            getMessages()
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to save message",
                variant: "destructive",
                duration: 2500,
            });
        }
    }

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
            handleSaveMessage();
        }
    }

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    }

    const getMessages = async () => {
        try {
            const response = await axios.post('/api/text/get', {
                sender: session?.user?.email,
                receiver: user.email
            });
            setDbMessages(response.data.messages);
            console.log(dbMessages)
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to get messages",
                variant: "destructive",
                duration: 2500,
            })
        }
    }

    useEffect(() => {
        getMessages();
    }, []);

    return (
        <div className="flex flex-col max-h-screen w-full">
            <div className="flex items-center rounded-xl justify-between p-3 border">
                <div className="flex items-center">
                    <div className='relative'>
                        <Image
                            className="w-10 h-10 bg-yellow-500 rounded-full mr-3"
                            src={user.image!}
                            alt={user.name}
                            width={40}
                            height={40}
                            fetchPriority='high'
                            loading='lazy'
                        />
                        {socket && <div className='absolute bottom-0 right-4 w-2 h-2 rounded-full bg-green-500'></div>}
                    </div>
                    <span className="font-semibold">{user.name}</span>
                </div>
                <div className="flex space-x-4">
                    <FaVideo className="text-[#aebac1] text-xl" />
                    <FaPhone className="text-[#aebac1] text-xl" />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                {dbMessages.length > 0 && dbMessages.map((data: Texts, index: React.Key) => (
                    <div
                        key={index}
                        className={`flex ${data.person === session?.user?.name ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] p-2 rounded-lg ${data.person === session?.user?.name
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-black'
                                }`}
                        >
                            <p><strong>{data.person}</strong>: {data.text}</p>
                        </div>
                    </div>
                ))}
                {socketMessages.length > 0 && socketMessages.map((data: Response, index: React.Key) => (
                    <div
                        key={index}
                        className={`flex ${data.person === session?.user?.name ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] p-2 rounded-lg ${data.person === session?.user?.name
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-black'
                                }`}
                        >
                            <p><strong>{data.person}</strong>: {data.text}</p>
                        </div>
                    </div>
                ))}
                {dbMessages.length === 0 && socketMessages.length === 0 && <p>No messages...</p>}
            </div>


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
