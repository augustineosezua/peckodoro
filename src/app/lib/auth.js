import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { reactResetPasswordEmail } from "./email/reset-password.js";
import { openAPI } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { encrypt } from "./encrypt";
import { resend } from "./email/resend";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BASE_URL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    async sendResetPassword({ user, url }) {
      const r = resend(process.env.RESEND_API_KEY);
      await r.emails.send({
        from: "Peckodoro <resetpasswords@freaksanta.online>",
        to: user.email,
        subject: "Reset your password",
        react: reactResetPasswordEmail({
          username: user.name,
          resetLink: url,
        }),
      });
    },
    resetPasswordTokenExpiresIn: 3600,
    password: {
      hash: async (password) => {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
      },
      verify: async ({ hash, password }) => {
        const isValid = await bcrypt.compare(password, hash);
        return isValid;
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    },
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      scope: ["user-read-email user-read-private user-read-playback-state user-modify-playback-state streaming"],
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://peckodoro.vercel.app",
    "https://peckodoro-git-prev-chickenjs-projects.vercel.app",
  ],
  plugins: [openAPI()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      return;
    }),
    after: createAuthMiddleware(async (ctx) => {
      const result = await ctx.context.returned;
      if (!result || !result.user) {
        return;
      }
      if (result.user.id) {
        const settings = await prisma.settings.findUnique({
          where: { userId: result.user.id || "" },
        });
        if (settings) {
          return;
        } else {
          await prisma.settings.create({
            data: {
              userId: result.user.id,
              longBreak: 15,
              shortBreak: 5,
              focusTime: 25,
              focusBeforeLong: 3,
              autoStart: false,
            },
          });
        }
      }
    }),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["spotify"],
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
});
