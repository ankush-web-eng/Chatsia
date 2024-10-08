import React from 'react';
import Image from 'next/image';
import { User } from '@prisma/client';
import {VideoCallSender} from '@/components/includes/VideoCallSender';
import { useToast } from '@/components/ui/use-toast';

interface Props {
    user: User;
    receiverStatus: string;
}

const ChatHeader: React.FC<Props> = ({ user, receiverStatus }) => {
    const { toast } = useToast();

    return (
        <div className="flex items-center rounded-xl justify-between p-3 border">
            <div className="flex items-center">
                <div className="relative">
                    <Image
                        className="w-10 h-10 bg-yellow-500 rounded-full mr-3"
                        src={user.image}
                        alt={user.name}
                        width={40}
                        height={40}
                        fetchPriority="high"
                        loading="lazy"
                    />
                    <div className={`absolute bottom-0 right-4 w-2 h-2 rounded-full ${receiverStatus === "online" ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex space-x-4">
                <VideoCallSender user={user} receiverStatus={receiverStatus}  />
            </div>
        </div>
    );
};

export default ChatHeader;
