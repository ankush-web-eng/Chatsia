'use client'
import { Skeleton } from "@/components/ui/skeleton"

export default function SingleChatSkeleton() {
    return (
        <div className="min-h-screen flex justify-center items-center">
            <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-[150px]" />
                    <Skeleton className="h-6 w-[250px]" />
                </div>
                <div className="flex flex-col space-y-2">
                    <Skeleton className="h-10 w-[300px]" />
                    <Skeleton className="h-10 w-[300px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    );
}