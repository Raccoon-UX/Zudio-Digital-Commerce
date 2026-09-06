import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma/client";
import { verifyPassword } from "@/lib/auth/password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-super-secret-key-at-least-32-chars-long",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // 1. Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // 2. Email & Password Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email and password.");
        }

        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password.");
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image || user.googleImage || null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth user creation or linking
      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Google OAuth Sign-in: Missing verified email in profile.");
          return false;
        }

        const email = user.email.trim().toLowerCase();
        const googlePic = (profile as any)?.picture || (profile as any)?.image || user.image || null;

        try {
          // Check if an account with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            // Existing user: Link session to the existing User.id and preserve existing role & passwordHash
            user.id = existingUser.id;
            (user as any).role = existingUser.role;
            (user as any).name = existingUser.name;

            // If Google image is provided and differs from stored googleImage, update googleImage only
            if (googlePic && existingUser.googleImage !== googlePic) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { googleImage: googlePic },
              });
            }

            // Resolved avatar: Custom uploaded image takes precedence over Google picture
            (user as any).image = existingUser.image || googlePic || null;
          } else {
            // New user: Atomically create User record, Cart, and Wishlist
            const displayName = user.name?.trim() || profile?.name?.trim() || "Customer";

            const newUser = await prisma.$transaction(async (tx) => {
              const createdUser = await tx.user.create({
                data: {
                  name: displayName,
                  email,
                  passwordHash: null,
                  role: "CUSTOMER",
                  googleImage: googlePic,
                },
              });

              await tx.cart.create({
                data: { userId: createdUser.id },
              });

              await tx.wishlist.create({
                data: { userId: createdUser.id },
              });

              return createdUser;
            });

            user.id = newUser.id;
            (user as any).role = newUser.role;
            (user as any).name = newUser.name;
            (user as any).image = googlePic;
          }

          return true;
        } catch (error) {
          console.error("Google OAuth Sign-in Database Error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "CUSTOMER";
        token.email = user.email;
        token.name = user.name;
        token.picture = (user as any).image || null;
      }
      // Support client session update trigger
      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.image !== undefined) token.picture = session.user.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token.id as string) || (token.sub as string);
        (session.user as any).role = (token.role as string) || "CUSTOMER";
        session.user.email = (token.email as string) || session.user.email;
        session.user.name = (token.name as string) || session.user.name;
        session.user.image = (token.picture as string) || null;
      }
      return session;
    },
  },
};
