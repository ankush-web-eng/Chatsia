'use client'
import { Skeleton } from "@/components/ui/skeleton"

export default function EmptyChatCardSkeleton() {
    return (
        <div className="flex-1 flex flex-col justify-center items-center max-md:hidden h-screen">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-8 w-48" />
        </div>
    );
}