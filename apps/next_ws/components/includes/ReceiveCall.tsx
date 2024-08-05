import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react";
import { User as UserModel } from "@prisma/client";

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"

export default function Receiver({ user }: { user: UserModel }) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const { data: session } = useSession();

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
        socketRef.current = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'register',
                from: session?.user?.email
            }));
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'incomingCall') {
                setIsOpen(true);
                await setupPeerConnection();
            } else if (message.type === 'createOffer') {
                await handleOffer(message);
            } else if (message.type === 'iceCandidate') {
                await pcRef.current?.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
        }

        return () => {
            socket.close();
        };
    }, [session?.user?.email]);

    const setupPeerConnection = async () => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.send(JSON.stringify({
                    type: 'iceCandidate',
                    from: session?.user?.email,
                    to: user.email,
                    candidate: event.candidate
                }));
            }
        };

        pc.ontrack = (event) => {
            if (videoRef.current && event.streams[0]) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });
        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    };

    const handleOffer = async (message: any) => {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await pcRef.current?.createAnswer();
        await pcRef.current?.setLocalDescription(answer);
        socketRef.current?.send(JSON.stringify({
            type: 'createAnswer',
            from: session?.user?.email,
            to: message.from,
            sdp: answer
        }));
    };

    useEffect(() => {
        return () => {
            if (pcRef.current) {
                pcRef.current.close();
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[90vw] w-full sm:max-w-[600px]">
                    <div className="w-full aspect-video bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}