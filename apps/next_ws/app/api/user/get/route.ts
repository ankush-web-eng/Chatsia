import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    try {
        const users = await prisma.user.findMany()

        const path = req.nextUrl.searchParams.get('path') || '/'
        revalidatePath(path)

        return NextResponse.json({ success: true, users }, { status: 200 })
        
    } catch (error) {
        return NextResponse.json({ success: true, message: "Server Error! Please login again." }, { status: 500 })
    }
}