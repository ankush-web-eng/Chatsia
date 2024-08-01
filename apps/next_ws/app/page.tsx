'use client'
import axios from "axios";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { LuLoader } from "react-icons/lu";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export default function Page() {

    const { data: session } = useSession()
    const router = useRouter()
    const { toast } = useToast()

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
            signOut()
            router.replace('/signin')
        } else {
            router.replace('/chats')
        }
    }

    useEffect(() => {
        createUser()
    }, [])

    return (
        <div className="flex min-h-screen justify-center items-center"><LuLoader className="animate-spin" /></div>
    )
}