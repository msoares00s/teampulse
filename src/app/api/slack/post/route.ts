import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("slack_access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Slack not connected" },
      { status: 401 }
    );
  }

  try {
    const { channel, message } = await request.json();

    if (!channel || !message) {
      return NextResponse.json(
        { error: "Channel and message are required" },
        { status: 400 }
      );
    }

    // First, find the channel ID by name
    const channelsResponse = await fetch(
      "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const channelsData = await channelsResponse.json();

    if (!channelsData.ok) {
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 }
      );
    }

    // Find channel by name (remove # if present)
    const channelName = channel.replace(/^#/, "");
    const targetChannel = channelsData.channels?.find(
      (c: { name: string }) => c.name === channelName
    );

    if (!targetChannel) {
      return NextResponse.json(
        { error: `Channel #${channelName} not found` },
        { status: 404 }
      );
    }

    // Post the message
    const postResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: targetChannel.id,
        text: message,
      }),
    });

    const postData = await postResponse.json();

    if (!postData.ok) {
      console.error("Slack post error:", postData);
      return NextResponse.json(
        { error: postData.error || "Failed to post message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: channelName,
      timestamp: postData.ts,
    });
  } catch (error) {
    console.error("Slack post error:", error);
    return NextResponse.json(
      { error: "Failed to post message" },
      { status: 500 }
    );
  }
}
