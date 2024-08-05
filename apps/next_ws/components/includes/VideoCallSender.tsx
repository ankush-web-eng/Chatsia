'use client'

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { User as UserModel } from "@prisma/client";

export default function VideoCallSender({ user }: { user: UserModel }) {
    const { data: session } = useSession();
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const handleWebSocketMessage = async (event: MessageEvent) => {
        const message = JSON.parse(event.data);

        if (message.to !== session?.user?.email) return;

        switch (message.type) {
            case 'createAnswer':
                await pcRef.current?.setRemoteDescription(new RTCSessionDescription(message.sdp));
                break;
            case 'iceCandidate':
                await pcRef.current?.addIceCandidate(new RTCIceCandidate(message.candidate));
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    };

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
        socketRef.current = socket;

        socket.onopen = async () => {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            pcRef.current = pc;

            const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

            // Display the local video stream
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }

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

            pc.oniceconnectionstatechange = () => {
                if (pc.iceConnectionState === 'disconnected') {
                    socket.close();
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.send(JSON.stringify({
                type: 'createOffer',
                from: session?.user?.email,
                to: user.email,
                sdp: offer
            }));
        };

        socket.onmessage = handleWebSocketMessage;

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            socket.close();
            pcRef.current?.close();
        };
    }, [session?.user?.email, user.email]);

    return (
        <div>
            <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
            />
        </div>
    );
}
