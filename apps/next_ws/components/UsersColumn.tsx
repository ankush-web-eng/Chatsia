'use client'

import axios from "axios";
import React, { useEffect, useState } from "react";
import { User as UserModel } from "@prisma/client";

import { useToast } from "@/components/ui/use-toast";
import UserCard from "@/components/Cards/UserCard";

export default function UsersColumn() {
    const [users, setUsers] = useState([]);
    const { toast } = useToast();

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
        <div className="flex flex-col justify-center items-center min-h-screen bg-white">
            <h1 className="text-3xl font-bold mb-6 text-black">Users</h1>
            <div className="w-full max-w-md bg-gray-100 rounded-lg shadow-lg p-6">
                {users.map((user: UserModel, index: React.Key) => (
                    <UserCard key={index} user={user} />
                ))}
            </div>
        </div>
    )
}