"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginUser(
  prevState: { error: string } | null | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: "/feed?welcome=1",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials. Please ensure your email and password are correct." };
        case "CallbackRouteError":
           return { error: "Database or connection error. Try the mock credentials: test@test.com / password." };
        default:
          return { error: "An unexpected error occurred during authentication. Please try again." };
      }
    }
    // Very Important: We must re-throw any other errors so Next.js internal 
    // mechanisms (like NEXT_REDIRECT) can trigger successful navigation correctly!
    throw error;
  }
}

export async function logoutUser() {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/?signedout=1" });
}
