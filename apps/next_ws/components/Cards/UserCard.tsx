import { User as UserModel } from "@prisma/client"
import Image from "next/image"

export default function UserCard({ user }: { user: UserModel }) {
    return (
        <div className="py-3 px-4 flex items-center space-x-4 border-b border-gray-200 last:border-b-0">
            <div className="w-12 h-12 relative overflow-hidden rounded-full border-2 border-black">
                <Image 
                    src={user.image} 
                    alt={user.name} 
                    layout="fill" 
                    objectFit="cover"
                />
            </div>
            <h2 className="text-lg font-semibold text-black">{user.name}</h2>
        </div>
    )
}