'use client'
import { useEffect, useRef, useState } from "react"

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Receiver({ username }: { username: string }) {

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        }
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.ontrack = (event) => {
            if (!videoRef.current) {
                return;
            }
            const video = videoRef.current;
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            video.style.width = '640px';
            video.style.height = '480px';
            video.style.border = '1px solid black';

            if (event.streams && event.streams[0]) {
                video.srcObject = event.streams[0];
            } else {
                video.srcObject = new MediaStream([event.track]);
            }

            video.onloadedmetadata = () => {
                video.play().then(() => {
                    console.log("Video playback started");
                }).catch(e => {
                    console.error("Error playing video:", e);
                });
            };

            video.onerror = (e) => {
                console.error("Video error:", e);
            };
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                if (!dialogRef.current) {
                    socket.send(JSON.stringify({
                        type: "cancelOffer"
                    }))
                    return;
                }
                setDialogOpen(true);
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }
    }

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

    const handleContinue = () => {
        setIsOpen(true);
        setDialogOpen(false);
    }

    return (
        <div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger><div ref={dialogRef} className="hidden"></div></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Do you want to pick up call from {username} ?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
