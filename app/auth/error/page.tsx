"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Authentication Error</CardTitle>
          <CardDescription className="text-gray-400">
            There was a problem with your authentication request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300 text-center">
            This could happen if the link has expired or has already been used. 
            Please try logging in again or request a new verification email.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
