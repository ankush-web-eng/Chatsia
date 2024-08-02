'use client'
import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect, KeyboardEvent } from 'react';

import { User as UserModel } from '@prisma/client';
import { Messages as Texts } from '@prisma/client';

import { Response } from '@/types/ResponseType';
import { DataProps } from '@/types/SendingDataType';
import { useToast } from '@/components/ui/use-toast';
import ChatHeader from '@/components/includes/ChatHeader';

import { IoIosSend } from 'react-icons/io';

const ChatInterface = ({ user }: { user: UserModel }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [text, setText] = useState<string>("");
    const [isTyped, setIsTyped] = useState<boolean>(false);
    const [dbMessages, setDbMessages] = useState<Texts[]>([]);
    const [socketMessages, setSocketMessages] = useState<Response[]>([]);
    const [receiverStatus, setReceiverStatus] = useState<string>("offline");
    const { data: session } = useSession();
    const { toast } = useToast();

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "register", from: session?.user?.email, to: user.email }));
            setSocket(socket);
        }

        socket.onmessage = (message) => {
            const parsedMessage = JSON.parse(message.data);

            if (parsedMessage.type === 'receiverStatus') {
                setReceiverStatus(parsedMessage.status);
            } else {
                setSocketMessages((prev) => [
                    ...prev,
                    ...(parsedMessage instanceof Array ? parsedMessage : [parsedMessage])
                ]);
            }
        }

        socket.onclose = () => {
            console.log("Disconnected from the server");
        }

        return () => {
            socket.close();
        }
    }, [session?.user?.email, user.email]);


    useEffect(() => {
        setIsTyped(text.trim().length > 0);
    }, [text]);

    const handleSaveMessage = async () => {
        try {
            await axios.post('/api/text/create', {
                text, reciever: user.email, sender: session?.user?.email, person: session?.user?.name
            });
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
            <ChatHeader user={user} receiverStatus={receiverStatus} />

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
