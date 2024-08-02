import { useEffect, useRef, useState } from "react"
import { FaVideo } from "react-icons/fa";
import { useToast } from "@/components/ui/use-toast";

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"


export const VideoCallSender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { toast } = useToast()
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
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

        if (!socket) {
            toast({
                title: 'Error',
                description: "Connection not found",
                variant: 'destructive',
                duration: 3000
            })
            return;
        }

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }

        const pc = new RTCPeerConnection();
        setPC(pc);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        }

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        }

        getCameraStreamAndSend(pc);
        setIsOpen(true);
    }

    const getCameraStreamAndSend = (pc: RTCPeerConnection) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            if (!videoRef.current) return;
            const video = videoRef.current;
            video.srcObject = stream;
            video.play().catch(e => {
                toast({ title: 'Error', description: e.message });
                return;
            });
            document.body.appendChild(video);
            stream.getTracks().forEach((track) => {
                pc?.addTrack(track);
            });
            toast({
                title: 'Success',
                description: "Waiting for receiver to accept call"
            })
        }).catch(error => {
            console.error('Error accessing audio:', error);
            toast({
                title: 'Error',
                description: "Could not access camera and microphone"
            });
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button onClick={initiateConn}><FaVideo className="text-[#36dada] text-xl" /></button>
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
    )
}