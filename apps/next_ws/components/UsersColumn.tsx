'use client'

import React, { useEffect, useState } from "react";
import { User as UserModel } from "@prisma/client";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import UserCard from "@/components/Cards/UserCard";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

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
        <div className="flex flex-col w-[30%] min-w-[300px] border-r border-gray bg-white ">
            <div className="p-4 space-y-2 flex flex-col justify-center">
                <input
                    type="text"
                    placeholder="Search or start new chat"
                    disabled
                    className="w-full p-2 border rounded-lg text-white"
                />
                <Button onClick={() => {
                    signOut().then(() => {
                        toast({
                            title: "Logged Out",
                            description: "You have been logged out",
                        });
                        router.replace('/signin')
                    })
                }}>Logout</Button>
            </div>
            <div className="overflow-y-auto flex-grow">
                {users
                .filter((user: UserModel) => user.email !== session?.user?.email)
                .map((user: UserModel, index: React.Key) => (
                    <UserCard key={index} user={user} selectedUser={selectedUser} />
                ))}
            </div>
        </div>
    )
}