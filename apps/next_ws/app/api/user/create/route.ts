import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
    try {
        const reqBody = await req.json()
        const { email, name, image } = reqBody

        const isUser = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (isUser) {
            return NextResponse.json({ success: true, message: "User already exists!" }, { status: 200 })
        }

        await prisma.user.create({
            data: {
                email,
                name,
                image
            }
        })

        const path = req.nextUrl.searchParams.get('path') || '/signin'
        revalidatePath(path)

        return NextResponse.json({ success: true, message: "User created successfully!" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: true, message: "Server Error! Please login again." }, { status: 500 })
    }
}