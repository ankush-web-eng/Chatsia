import { Metadata } from "next";
import dynamic from "next/dynamic";

import UserPageSkeleton from "@/components/skeleton/UserColumnSkeleton";
import EmptyChatCardSkeleton from "@/components/skeleton/EmptyChatCard";
const UsersColumn = dynamic(() => import("@/components/UsersColumn"), { ssr: false, loading: () => <UserPageSkeleton /> });
const EmptyChatCard = dynamic(() => import("@/components/Cards/EmptyChatCard"), { ssr: false, loading: () => <EmptyChatCardSkeleton /> });

export const metadata: Metadata = {
  title: "Chats",
  description: "Manage your chats and calls"
}

export default function Page() {
  return (
    <div className="flex w-screen h-screen">
      <div className="max-md:w-full"><UsersColumn /></div>
      <div className="max-md:hidden w-full h-full flex justify-center items-center"><EmptyChatCard /></div>
    </div>
  )
}