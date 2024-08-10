'use client'

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

import { User as UserModel } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import UserCard from "@/components/Cards/UserCard";
import { Button } from "@/components/ui/button";

export default function UsersColumn({ selectedUser }: { selectedUser?: string }) {
    const [users, setUsers] = useState([]);
    const { toast } = useToast();
    const { data: session } = useSession()
    const router = useRouter()

    const getUsers = async () => {
        try {
            const res = await axios.get('/api/user/get');
            setUsers(res.data.users);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "An error occurred while fetching users",
                variant: "destructive"
            });
        }
    }

    useEffect(() => {
        getUsers();
    }, [])

    return (
        <div className="flex flex-col w-full md:w-[30%] md:min-w-[300px] border-r h-screen border-gray bg-white">
            <div className="p-4 space-y-2">
                <input
                    type="text"
                    placeholder="Search or start new chat"
                    className="w-full p-2 border rounded-lg text-white"
                    onClick={() => {
                        toast({
                            title: "Search is disabled",
                            description: "Search functionality is disabled for now",
                        });
                    }}
                />
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {users
                    .filter((user: UserModel) => user.email !== session?.user?.email)
                    .map((user: UserModel, index: React.Key) => (
                        <UserCard key={index} user={user} selectedUser={selectedUser} />
                    ))}
            </div>
            <div className="p-3">
                <Button className="w-full" onClick={() => {
                    signOut().then(() => {
                        toast({
                            title: "Logged Out",
                            description: "You have been logged out",
                        });
                        router.replace('/signin')
                    })
                }}>Logout</Button>
            </div>
        </div>
    )
}