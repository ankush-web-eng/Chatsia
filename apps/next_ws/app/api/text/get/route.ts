import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function POST(req:NextRequest){
    try {
        const reqBody = await req.json()
        const {sender, reciever} = reqBody;
        console.log(sender, reciever)

        const messages = await prisma.messages.findMany({
            where : {
                sender,
                reciever
            },
            select : {
                text : true,
                createdAt : true,
                id : true,
                sender : true,
                reciever : true,
                person : true
            }
        })

        console.log(messages)

        if (!messages) {
            return NextResponse.json({success:false, message : "No Messages Found..."}, {status: 404});
        }

        const path = req.nextUrl.searchParams.get("path") || `/chats/${reciever}`
        revalidatePath(path)

        return NextResponse.json({success:true, messages}, {status: 200});

    } catch (error) {
        return NextResponse.json({success:false, message : "Server Error..."}, {status: 500});
    }
}