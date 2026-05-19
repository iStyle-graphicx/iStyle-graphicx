"use client"

import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-white">Authentication Error</CardTitle>
          <CardDescription className="text-gray-400">
            There was an issue with the authentication process. This could be due to an expired link
            or an invalid request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-400 text-center">
            <p>Please try the following:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Request a new verification email</li>
              <li>Try logging in again</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
