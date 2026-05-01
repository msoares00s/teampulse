import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Clear the httpOnly access token cookie
  cookieStore.delete("slack_access_token");
  cookieStore.delete("slack_team_name");

  return NextResponse.json({ success: true });
}
