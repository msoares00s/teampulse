import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SlackChannel {
  id: string;
  name: string;
}

interface SlackMessage {
  user: string;
  text: string;
  ts: string;
}

interface SlackUser {
  id: string;
  real_name?: string;
  name: string;
}

async function fetchSlackData(token: string) {
  const messages: { channel: string; user: string; text: string; ts: string }[] = [];
  const userCache: Record<string, string> = {};

  // Fetch channels
  const channelsRes = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=20", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const channelsData = await channelsRes.json();

  if (!channelsData.ok) {
    console.error("Failed to fetch channels:", channelsData.error);
    return [];
  }

  const channels: SlackChannel[] = channelsData.channels || [];

  // Fetch users for name lookup
  const usersRes = await fetch("https://slack.com/api/users.list?limit=100", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const usersData = await usersRes.json();

  if (usersData.ok && usersData.members) {
    for (const user of usersData.members as SlackUser[]) {
      userCache[user.id] = user.real_name || user.name;
    }
  }

  // Fetch recent messages from each channel (last 7 days)
  const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

  for (const channel of channels.slice(0, 10)) {
    try {
      const historyRes = await fetch(
        `https://slack.com/api/conversations.history?channel=${channel.id}&oldest=${oneWeekAgo}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const historyData = await historyRes.json();

      if (historyData.ok && historyData.messages) {
        for (const msg of historyData.messages as SlackMessage[]) {
          if (msg.text && !msg.text.startsWith("<") && msg.text.length > 10) {
            const userName = userCache[msg.user] || "Unknown";
            const timestamp = new Date(parseFloat(msg.ts) * 1000);
            const timeAgo = getTimeAgo(timestamp);

            messages.push({
              channel: `#${channel.name}`,
              user: userName,
              text: msg.text.substring(0, 500),
              ts: timeAgo,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch history for ${channel.name}:`, err);
    }
  }

  return messages.slice(0, 100);
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return "just now";
}

export async function POST(request: NextRequest) {
  try {
    const { companyContext } = await request.json();

    // Get Slack token from cookie
    const cookieStore = await cookies();
    const slackToken = cookieStore.get("slack_access_token")?.value;

    let messagesText: string;

    if (slackToken) {
      const slackMessages = await fetchSlackData(slackToken);
      if (slackMessages.length > 0) {
        messagesText = slackMessages.map((m) => `[${m.channel}] ${m.user} (${m.ts}): ${m.text}`).join("\n");
      } else {
        return NextResponse.json({ error: "No messages found in Slack channels" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Slack not connected. Please connect Slack first." }, { status: 401 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are TeamPulse, an AI management assistant for ${companyContext.name}, a ${companyContext.type} with ${companyContext.teamSize} people.

Analyze these Slack messages and generate a weekly management review:

${messagesText}

Generate a JSON response with these sections:

1. topPriorities: The 3-5 most important things the founder should focus on this week
2. followUps: Action items that were mentioned but may not have been completed
3. blockers: Things slowing the team down or stuck work
4. decisions: Pending choices that need founder input
5. teamUpdate: A 2-3 paragraph draft update the founder could send to the team
6. meetingAgenda: 5-7 suggested agenda items for the next team meeting

Respond ONLY with valid JSON:
{
  "topPriorities": [
    {"text": "Priority description", "source": "Slack #channel", "action": "Suggested next step"}
  ],
  "followUps": [
    {"text": "Follow-up needed", "source": "Slack #channel", "urgent": true, "action": "What to do"}
  ],
  "blockers": [
    {"text": "Blocker description", "source": "Slack #channel", "team": "engineering", "action": "How to unblock"}
  ],
  "decisions": [
    {"text": "Decision needed", "source": "Slack #channel", "action": "Options to consider"}
  ],
  "teamUpdate": "Draft team update text...",
  "meetingAgenda": ["Agenda item 1", "Agenda item 2"],
  "generatedAt": "${new Date().toISOString()}"
}

Be specific, actionable, and reference actual people and channels. Prioritize by business impact.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      try {
        let jsonText = content.text.trim();

        // Extract JSON from markdown code blocks if present
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }

        return NextResponse.json(JSON.parse(jsonText));
      } catch (parseError) {
        console.error("Failed to parse response:", content.text);
        console.error("Parse error:", parseError);
        return NextResponse.json({ error: "Failed to parse review" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
  } catch (error) {
    console.error("Digest API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to generate review: ${errorMessage}` }, { status: 500 });
  }
}
