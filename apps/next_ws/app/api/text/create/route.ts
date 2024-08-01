import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function POST(req:NextRequest){
    try {
        const reqBody = await req.json()
        const { text, reciever, sender, person } = reqBody;

        const message = await prisma.messages.create({
            data: {
                text,
                reciever,
                sender,
                person
            }
        });

        if (!message) {
            return NextResponse.json({success:false, message : "Failed to send message..."}, {status: 400});
        }

        return NextResponse.json({success:true, message : "Message sent successfully..."});

    } catch (error) {
        return NextResponse.json({success:false, message : "Server Error..."}, {status: 500});
    }
}