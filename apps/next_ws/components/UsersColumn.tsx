'use client'

import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";
import { signOut, useSession } from "next-auth/react";

import { User as UserModel } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import UserCard from "@/components/Cards/UserCard";
import { Button } from "@/components/ui/button";
import UserPageSkeleton from "./skeleton/UserColumnSkeleton";
import { useQuery } from "@tanstack/react-query";

export default function UsersColumn({ selectedUser }: { selectedUser?: string }) {
    const { toast } = useToast();
    const { data: session } = useSession();
    const router = useRouter();

    const getUsers = async () => {
        const res = await axios.get('/api/user/get');
        return res.data.users;
    };

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
        staleTime: 1000 * 60 * 5,
    });

    if (isLoading) {
        return <UserPageSkeleton />;
    }

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
                    .map((user: UserModel) => (
                        <UserCard key={user.id} user={user} selectedUser={selectedUser} />
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
    );
}
