'use client'
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePageSkeleton() {
    return (
        <div className="flex w-screen h-screen">
            <div className="w-64 flex flex-col p-4 border-r max-md:w-screen">
                <Skeleton className="h-10 w-full mb-4" />
                <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-10 w-full mt-auto" />
            </div>
            <div className="flex-1 flex flex-col justify-center items-center max-md:hidden">
                <Skeleton className="h-16 w-16 rounded-full mb-4" />
                <Skeleton className="h-8 w-48" />
            </div>
        </div>
    );
}