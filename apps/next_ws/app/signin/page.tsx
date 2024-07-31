import Auth from "@/components/Auth";
import { Metadata } from "next";

export const metadata : Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
  keywords: "Sign in, Login, Account"
}

export default function Home() {
  return <Auth /> 
}