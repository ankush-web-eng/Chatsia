import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import SessionProvider from '@/context/SessionProvider'
import { getServerSession } from "next-auth";
import { Toaster } from "@/components/ui/toaster";
import ReactQueryProvider from "@/context/ReactQueryContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Chatsia",
    template: "%s | Chatsia"
  },
  description: "Connect woth your friends and family",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
