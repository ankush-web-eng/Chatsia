'use client'
import { Skeleton } from "@/components/ui/skeleton"

export default function ChatInterfaceSkeleton() {
    return (
        <div className="flex w-screen h-screen">

            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
                {/* Chat header */}
                <div className="h-16 border-b flex items-center px-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32 ml-3" />
                    <Skeleton className="h-8 w-8 ml-auto rounded-full" />
                </div>

                {/* Chat messages */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <Skeleton className={`h-10 w-48 rounded-lg ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`} />
                        </div>
                    ))}
                </div>

                {/* Message input */}
                <div className="h-16 border-t flex items-center px-4">
                    <Skeleton className="h-10 w-full rounded-full" />
                </div>
            </div>
        </div>
    );
}