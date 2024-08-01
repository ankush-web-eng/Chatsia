'use client'

import axios from "axios";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

import ChatInterface from "@/components/Cards/ChatCard";
import { useToast } from "@/components/ui/use-toast";
import UsersColumn from "@/components/UsersColumn";
import EmptyChatCard from "@/components/Cards/EmptyChatCard";

export default function Page() {

  const { email } = useParams()
  const decodedEmail = decodeURIComponent(email.toString())
  const { toast } = useToast()
  const [user, setUser] = useState(null)

  const getUser = async () => {
    try {
      const response = await axios.post('/api/user/single', { email: decodedEmail })
      setUser(response.data.user)
    } catch (error) {
      console.error(error)
      toast({
        title: "An error occurred",
        description: "An error occurred while fetching users",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    getUser()
  }, [])

  return (
    <div className="flex w-screen h-screen">
      <div className="max-md:hidden"><UsersColumn selectedUser={decodedEmail} /></div>
      {user === null ? <EmptyChatCard /> : <ChatInterface user={user} />}
    </div>
  )
}