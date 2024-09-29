'use client'
import axios from "axios";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

const HomePageSkeleton = dynamic(() => import("@/components/skeleton/HomePageSkeleton"));

export default function Page() {

    const [socket, setSocket] = useState<WebSocket | null>(null);

    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const createUser = async () => {
        const response = await axios.post('/api/user/create', {
            email: session?.user?.email,
            name: session?.user?.name,
            image: session?.user?.image
        })
        if (response.data.error) {
            toast({
                title: "Failed",
                description: response.data.error,
                variant: 'destructive'
            })
            signOut();
            router.replace('/signin');
        } else {
            router.replace('/chats');
        }
    }

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "register", from: session?.user?.email }));
            setSocket(socket);
        }

        return () => {
            socket.close();
        }
    }, []);

    useEffect(() => {
        createUser()
    }, [])

    return <HomePageSkeleton />
}