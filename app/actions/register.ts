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
    const role = formData.get("role") as "CUSTOMER" | "MERCHANT";

    if (!name || !email || !passwordRaw) {
      return { error: "Please fill in all required fields." };
    }

    if (!role || (role !== "CUSTOMER" && role !== "MERCHANT")) {
        return { error: "Invalid role selected." };
    }

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
       return { error: "An account with this email already exists." };
    }

    // Admin Vetting Flow: Merchants are Customers until approved.
    const actualRole = role === "MERCHANT" ? "CUSTOMER" : role;

    // Attempt creation. The userRepository handles the bcrypt hashing.
    const user = await createUser({
      name,
      email,
      phone,
      passwordRaw,
      role: actualRole,
    });

    if (!user) {
      return { error: "Database error: Failed to insert user into PostgreSQL." };
    }

    // Log the Merchant Application to the DB
    if (role === "MERCHANT") {
      const storeName = formData.get("storeName") as string;
      const address = formData.get("address") as string;
      const socialMedia = formData.get("socialMedia") as string;
      
      if (!storeName || !address) {
        return { error: "Please provide your Store Name and Address." };
      }

      const { createMerchantApplication } = await import("@/lib/repositories/userRepository");
      await createMerchantApplication(user.id, storeName, address, socialMedia);
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
