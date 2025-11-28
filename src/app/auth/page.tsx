"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { FaGoogle } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
      }
    };
    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (session) {
          router.push("/"); // Redirect to main page after login
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // Changed this line!
        },
      });
    } catch (error) {
      console.error("Authentication error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6 text-3xl font-bold">
            <p>Intern Hours Tracker</p>
          </div>
          <CardDescription>
            Sign in to your google account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 cursor-pointer"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <FaGoogle className="mr-2" />
            )}
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}