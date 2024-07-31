
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
// export { default } from 'next-auth/middleware';

export const config = {
    matcher: ['/signin','/',],
};

export default async function middleware(request: NextRequest) {

    const token = await getToken({ req: request });
    const url = request.nextUrl;
    if (
        token &&
        (url.pathname.startsWith('/signin') )
    ) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (
        !token &&
        (url.pathname === '/')
    ) {
        return NextResponse.redirect(new URL('/signin', request.url));
    }

    return NextResponse.next();
}