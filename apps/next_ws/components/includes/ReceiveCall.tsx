'use client'
import { useEffect, useRef, useState } from "react"

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function Receiver() {

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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
        const video = document.createElement('video');
        document.body.appendChild(video);

        const pc = new RTCPeerConnection();
        pc.ontrack = (event) => {
            console.log("Track received:", event.track);
            console.log("Track kind:", event.track.kind);
            console.log("Track readyState:", event.track.readyState);
            console.log("Streams:", event.streams);

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
            document.body.appendChild(video);

            if (event.streams && event.streams[0]) {
                console.log("Setting video srcObject with stream");
                video.srcObject = event.streams[0];
            } else {
                console.log("Creating new MediaStream with track");
                video.srcObject = new MediaStream([event.track]);
            }

            video.onloadedmetadata = () => {
                console.log("Video metadata loaded");
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

    return (
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
    )

}