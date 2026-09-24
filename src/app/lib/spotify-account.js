import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { isAdminEmail } from "@/app/lib/admins";

// Resolve the signed-in VIP's linked Spotify account from the request's session.
// Returns { error, status } when the caller isn't allowed or has nothing linked.
export async function getSpotifyAccount(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { error: "Log in to use Spotify", status: 401 };
  }
  if (!isAdminEmail(session.user.email)) {
    return { error: "Spotify is only available to VIP members", status: 403 };
  }
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "spotify" },
  });
  if (!account?.refreshToken) {
    return { error: "No Spotify account linked", status: 404 };
  }
  return { account };
}

// Return a usable access token, refreshing it with Spotify only when it's about to expire
export async function getFreshToken(account) {
  const expiresAt = account.accessTokenExpiresAt?.getTime() ?? 0;
  // Spotify grants are stored space- or comma-separated depending on the flow
  const scopes = (account.scope || "").split(/[\s,]+/).filter(Boolean);
  if (account.accessToken && expiresAt - Date.now() > 60_000) {
    return { accessToken: account.accessToken, expiresAt, scopes };
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
    }).toString(),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    return { error: json.error_description || json.error || "Refresh failed" };
  }

  const newExpiresAt = Date.now() + json.expires_in * 1000;
  await prisma.account.update({
    where: { id: account.id },
    data: {
      accessToken: json.access_token,
      // Spotify only sometimes rotates the refresh token
      ...(json.refresh_token ? { refreshToken: json.refresh_token } : {}),
      accessTokenExpiresAt: new Date(newExpiresAt),
    },
  });
  return {
    accessToken: json.access_token,
    expiresAt: newExpiresAt,
    scopes: json.scope ? json.scope.split(" ") : scopes,
  };
}
