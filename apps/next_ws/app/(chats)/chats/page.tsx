import EmptyChatCard from "@/components/Cards/EmptyChatCard";
import UsersColumn from "@/components/UsersColumn";
import { Metadata } from "next";

export const metadata : Metadata = {
  title: "Chats",
  description: "Manage your chats and calls"
}

export default function Page() {
  return (
    <div className="flex w-screen h-screen">
      <UsersColumn />
      <EmptyChatCard />
    </div>
  )
}