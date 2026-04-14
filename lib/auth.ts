import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmailForAuth } from "./repositories/userRepository";
import { authConfig } from "./auth.config";

// ... (Rest of TypeScript augmentation omitted for brevity, but I need to replace the whole authorize function)
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Use standard repository instead of raw query
          const user = await findUserByEmailForAuth(email);

          if (!user || !user.passwordHash) {
            return null;
          }

          // Validate password with bcrypt
          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      }
    })
  ]
});
