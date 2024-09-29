import { Button } from "@/components/ui/button"
import { MessageCircle, Video, LogIn } from "lucide-react"
import Link from "next/link"
import Auth from "./Auth"

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-100 to-blue-200">
            <header className="px-4 lg:px-6 h-14 flex items-center">
                <Link href="/" className="flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                    <span className="ml-2 text-2xl font-bold text-blue-600">ChatSia</span>
                </Link>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-blue-800">
                    Connect, Chat, and Call with Ease
                </h1>
                <p className="mx-auto max-w-[700px] text-lg text-blue-700 mt-4 mb-8">
                    Experience seamless communication with ChatSia - your all-in-one platform for messaging and video calls.
                </p>
                <Auth >
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign in with Google
                    </Button>
                </Auth>
                <div className="flex items-center justify-center space-x-4 mt-8">
                    <div className="flex items-center">
                        <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-blue-700">Instant Messaging</span>
                    </div>
                    <div className="flex items-center">
                        <Video className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-blue-700">Video Calls</span>
                    </div>
                </div>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-blue-300">
                <p className="text-xs text-blue-700">
                    © 2023 ChatSia. All rights reserved.
                </p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4 text-blue-700" href="#">
                        Terms of Service
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4 text-blue-700" href="#">
                        Privacy
                    </Link>
                </nav>
            </footer>
        </div>
    )
}