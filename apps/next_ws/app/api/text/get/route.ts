import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const reqBody = await req.json();
        const { sender, receiver } = reqBody;
        console.log(sender, receiver);

        const messages = await prisma.messages.findMany({
            where: {
                OR: [
                    { sender: sender, reciever: receiver },
                    { sender: receiver, reciever: sender }
                ]
            },
            select: {
                text: true,
                createdAt: true,
                id: true,
                sender: true,
                reciever: true,
                person: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        if (!messages.length) {
            return NextResponse.json({ success: false, message: "No Messages Found..." }, { status: 404 });
        }

        const path = req.nextUrl.searchParams.get("path") || `/chats/${receiver}`;
        revalidatePath(path);

        return NextResponse.json({ success: true, messages }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: "Server Error..." }, { status: 500 });
    }
}
