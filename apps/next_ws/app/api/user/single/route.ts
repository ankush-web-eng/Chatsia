import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function POST(req: NextRequest){
    try {
        const reqBody = await req.json();
        const {email} = reqBody;

        const user = await prisma.user.findUnique({
            where : {
                email
            }
        })

        if(!user){
            return NextResponse.json({success:false, message:"User not found"}, {status:404});
        }

        const path = req.nextUrl.searchParams.get('path') || `/chats/${email}`;
        revalidatePath(path);

        return NextResponse.json({success:true, user}, {status:200});

    } catch (error) {
        return NextResponse.json({success:false, message:"An error occurred while fetching users"}, {status:500});
    }
    
}