import Image from "next/image";

export default function EmptyChatCard() {
    return (
        <div className="flex-grow flex items-center justify-center bg-white">
            <div className="text-center text-gray-400">
                <Image src='/chat.svg' alt="Chat icon" height={100} width={100} className="mx-auto mb-4" />
                <h2 className="text-3xl font-light mb-2">Manage Chat and Call</h2>
            </div>
        </div>
    )
}