import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { User as UserModel } from "@prisma/client";

import { useToast } from "@/components/ui/use-toast";
import { FaVideo } from "react-icons/fa";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export const VideoCallSender = ({ receiverStatus, user } : {receiverStatus : string, user : UserModel}) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { toast } = useToast();
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const {data:session} = useSession();

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'sender' }));
        };

        return () => {
            socket.close();
        };
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            console.log("Video element is available");
            if (videoRef.current.srcObject) {
                console.log("Video has a source");
            } else {
                console.log("Video does not have a source");
            }
        }
    }, [isOpen]);

    const initiateConn = async () => {
        if (receiverStatus === 'offline') {
            toast({
                title: 'User Offline',
                description: `${user.name} is offline`,
                variant: 'destructive',
                duration: 3000
            });
            return;
        }

        if (!socket) {
            toast({
                title: 'Error',
                description: "Connection not found",
                variant: 'destructive',
                duration: 3000
            });
            return;
        }

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'iceCandidate',
                    from: session?.user?.email,
                    to: user.email,
                    candidate: event.candidate
                }));
            }
        };

        pc.onnegotiationneeded = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.send(JSON.stringify({
                    type: 'createOffer',
                    from: session?.user?.email,
                    to: user.email,
                    sdp: pc.localDescription
                }));
            } catch (error) {
                console.error("Error during negotiation:", error);
            }
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                await pc.addIceCandidate(message.candidate);
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });
            setIsOpen(true);
        } catch (error) {
            toast({
                title: 'Error',
                description: "Failed to access media devices",
                variant: 'destructive',
                duration: 3000
            });
            console.error("Error accessing media devices:", error);
        }
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button onClick={initiateConn}>
                    <FaVideo className="text-[#36dada] text-xl" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-full sm:max-w-[600px]">
                <div className="w-full aspect-video bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
