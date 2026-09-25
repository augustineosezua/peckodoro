import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { isAdminEmail } from "@/app/lib/admins";
import Home from "./Home";

// Work out who's visiting while the page renders, so it arrives already
// signed in (or out) with their timer settings, not after a chain of requests.
async function loadVisitor() {
  const found = await auth.api.getSession({ headers: await headers() });
  if (!found?.user) return { session: null, settings: null, isAdmin: false, spotifyLinked: false };

  const { id, email, name, image } = found.user;
  const isAdmin = isAdminEmail(email);
  const [settings, spotify] = await Promise.all([
    prisma.settings.findUnique({ where: { userId: id } }),
    isAdmin
      ? prisma.account.findFirst({
          where: { userId: id, providerId: "spotify" },
          select: { refreshToken: true },
        })
      : null,
  ]);
  if (settings) delete settings.id;

  return {
    // Only what the page uses; the session token stays in its httpOnly cookie
    session: { user: { id, email, name, image } },
    settings,
    isAdmin,
    spotifyLinked: Boolean(spotify?.refreshToken),
  };
}

export default async function Page() {
  // If this fails, the page falls back to checking in the browser
  const initial = await loadVisitor().catch((err) => {
    console.error("Couldn't preload the visitor", err);
    return null;
  });
  return <Home initial={initial} />;
}
