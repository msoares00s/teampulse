import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/slack`;

  // Handle OAuth errors from Slack
  if (error) {
    return NextResponse.redirect(
      new URL("/dashboard/tools?error=slack_denied", request.url)
    );
  }

  // If no code, initiate OAuth flow
  if (!code) {
    if (!clientId) {
      return NextResponse.redirect(
        new URL("/dashboard/tools?error=slack_not_configured", request.url)
      );
    }

    const scopes = [
      "channels:history",
      "channels:read",
      "groups:history",
      "groups:read",
      "users:read",
      "team:read",
    ].join(",");

    const slackAuthUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackAuthUrl.searchParams.set("client_id", clientId);
    slackAuthUrl.searchParams.set("scope", scopes);
    slackAuthUrl.searchParams.set("redirect_uri", redirectUri);

    return NextResponse.redirect(slackAuthUrl.toString());
  }

  // Handle callback with code
  try {
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/dashboard/tools?error=slack_not_configured", request.url)
      );
    }

    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error("Slack OAuth error:", tokenData);
      return NextResponse.redirect(
        new URL("/dashboard/tools?error=slack_token_failed", request.url)
      );
    }

    // Store token and team info in cookies
    const response = NextResponse.redirect(
      new URL("/dashboard/tools?slack=connected", request.url)
    );

    response.cookies.set("slack_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    if (tokenData.team) {
      response.cookies.set("slack_team_name", tokenData.team.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err) {
    console.error("Slack OAuth error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/tools?error=slack_failed", request.url)
    );
  }
}
