import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  num_members?: number;
  purpose?: { value: string };
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  is_bot: boolean;
  deleted: boolean;
  profile?: {
    display_name?: string;
    image_48?: string;
    title?: string;
  };
}

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
    // Fetch channels and users in parallel
    const [channelsResponse, usersResponse] = await Promise.all([
      fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("https://slack.com/api/users.list?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const [channelsData, usersData] = await Promise.all([
      channelsResponse.json(),
      usersResponse.json(),
    ]);

    // Process channels
    const channels: Array<{
      id: string;
      name: string;
      isPrivate: boolean;
      memberCount: number;
      purpose: string;
    }> = [];

    if (channelsData.ok && channelsData.channels) {
      for (const channel of channelsData.channels as SlackChannel[]) {
        if (channel.is_member) {
          channels.push({
            id: channel.id,
            name: channel.name,
            isPrivate: channel.is_private,
            memberCount: channel.num_members || 0,
            purpose: channel.purpose?.value || "",
          });
        }
      }
    }

    // Process users (filter out bots and deleted)
    const teamMembers: Array<{
      id: string;
      name: string;
      displayName: string;
      title: string;
      avatar: string;
    }> = [];

    if (usersData.ok && usersData.members) {
      for (const user of usersData.members as SlackUser[]) {
        if (!user.is_bot && !user.deleted && user.name !== "slackbot") {
          teamMembers.push({
            id: user.id,
            name: user.real_name || user.name,
            displayName: user.profile?.display_name || user.name,
            title: user.profile?.title || "",
            avatar: user.profile?.image_48 || "",
          });
        }
      }
    }

    // Get team info
    const teamResponse = await fetch("https://slack.com/api/team.info", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const teamData = await teamResponse.json();

    return NextResponse.json({
      success: true,
      workspace: teamData.ok ? teamData.team?.name : "Your Workspace",
      channels: channels.sort((a, b) => b.memberCount - a.memberCount),
      teamMembers: teamMembers.slice(0, 50), // Limit to 50 members
      summary: {
        totalChannels: channels.length,
        totalMembers: teamMembers.length,
        privateChannels: channels.filter((c) => c.isPrivate).length,
        publicChannels: channels.filter((c) => !c.isPrivate).length,
      },
    });
  } catch (error) {
    console.error("Slack audit failed:", error);
    return NextResponse.json(
      { error: "Failed to audit Slack workspace" },
      { status: 500 }
    );
  }
}
