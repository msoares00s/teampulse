import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("slack_access_token")?.value;

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    // Verify token by calling auth.test
    const authResponse = await fetch("https://slack.com/api/auth.test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authData = await authResponse.json();

    if (!authData.ok) {
      return NextResponse.json({ connected: false, error: authData.error });
    }

    // Check scopes to see if we have write permission
    const scopesHeader = authResponse.headers.get("x-oauth-scopes") || "";
    const hasWritePermission = scopesHeader.includes("chat:write");

    return NextResponse.json({
      connected: true,
      user: authData.user,
      team: authData.team,
      teamId: authData.team_id,
      hasWritePermission,
    });
  } catch (error) {
    console.error("Slack status check failed:", error);
    return NextResponse.json({ connected: false, error: "Failed to verify connection" });
  }
}
