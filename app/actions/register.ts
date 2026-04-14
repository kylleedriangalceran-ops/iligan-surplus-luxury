"use server";


import { createUser, findUserByEmail } from "@/lib/repositories/userRepository";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerUser(
  prevState: { error?: string } | null | undefined,
  formData: FormData
) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const passwordRaw = formData.get("password") as string;
    if (!name || !email || !passwordRaw) {
      return { error: "Please fill in all required fields." };
    }

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
       return { error: "An account with this email already exists." };
    }

    // Attempt creation. The userRepository handles the bcrypt hashing.
    // We enforce CUSTOMER role for all new signups natively here.
    const user = await createUser({
      name,
      email,
      phone,
      passwordRaw,
      role: "CUSTOMER",
    });

    if (!user) {
      return { error: "Database error: Failed to insert user into PostgreSQL." };
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes("DB Error")) {
      return { error: error.message };
    }
    
    // We must re-throw any other errors so Next.js internal mechanisms can redirect if we put it in the try block
    console.error("registerUser error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }

  // Auto-login after successful registration
  try {
    const email = formData.get("email") as string;
    const passwordRaw = formData.get("password") as string;
    await signIn("credentials", {
      email,
      password: passwordRaw,
      redirectTo: "/feed?welcome=1",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to log in automatically. Please sign in." };
    }
    // Re-throw the redirect response
    throw error;
  }
}
