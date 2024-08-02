import { useEffect, useState } from "react"
import { FaVideo } from "react-icons/fa";
import { useToast } from "@/components/ui/use-toast";

export const AudioCallSender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [, setPC] = useState<RTCPeerConnection | null>(null);
    const {toast} = useToast()

    useEffect(() => {
        const socket = new WebSocket(process.env.NEXT_PUBLIC_WSS_URL!);
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
    }, []);

    const initiateConn = async () => {

        if (!socket) {
            toast({
                title: 'error',
                description: "Connection not found"
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

        getAudioStreamAndSend(pc);
    }

    const getAudioStreamAndSend = (pc: RTCPeerConnection) => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
            stream.getTracks().forEach((track) => {
                pc?.addTrack(track, stream);
            });
        }).catch(error => {
            console.error('Error accessing audio:', error);
            toast({
                title: 'Error',
                description: "Could not access microphone"
            });
        });
    }

    return (
        <div>
            <button onClick={initiateConn}><FaVideo className="text-[#36dada] text-xl" /></button>
        </div>
    )
}