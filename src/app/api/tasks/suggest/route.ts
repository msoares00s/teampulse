import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SlackAudit {
  workspace: string;
  channels: Array<{
    name: string;
    isPrivate: boolean;
    memberCount: number;
    purpose: string;
  }>;
  teamMembers: Array<{
    name: string;
    title: string;
  }>;
  summary: {
    totalChannels: number;
    totalMembers: number;
  };
}

interface CompanyResearch {
  description: string;
  industry: string;
  insights: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { audit, research, companyName } = await request.json();

    if (!audit) {
      return NextResponse.json(
        { error: "Audit data is required" },
        { status: 400 }
      );
    }

    const slackAudit = audit as SlackAudit;
    const companyResearch = research as CompanyResearch | undefined;

    // Build context about the workspace
    const channelList = slackAudit.channels
      .slice(0, 10)
      .map((c) => `- #${c.name}${c.purpose ? `: ${c.purpose}` : ""} (${c.memberCount} members)`)
      .join("\n");

    const teamRoles = slackAudit.teamMembers
      .filter((m) => m.title)
      .slice(0, 10)
      .map((m) => `- ${m.name}: ${m.title}`)
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are helping set up automated management tasks for a team's Slack workspace.

Company: ${companyName || "Unknown"}
${companyResearch ? `Industry: ${companyResearch.industry}` : ""}
${companyResearch ? `About: ${companyResearch.description}` : ""}

Slack Workspace Analysis:
- ${slackAudit.summary.totalChannels} channels
- ${slackAudit.summary.totalMembers} team members

Key Channels:
${channelList || "No channels found"}

${teamRoles ? `Team Roles:\n${teamRoles}` : ""}

${companyResearch?.insights ? `Business Insights:\n${companyResearch.insights.map((i) => `- ${i}`).join("\n")}` : ""}

Based on this workspace structure and company context, suggest 4-6 automated tasks that would help the manager stay on top of things. Consider:
- The types of channels (are there project channels, team channels, client channels?)
- The team size and structure
- The industry and business model
- Common management challenges for this type of organization

Each task should be specific and actionable, tailored to what you see in their Slack.

IMPORTANT: Output ONLY raw JSON, no markdown, no code blocks:
{"tasks": [{"id": "unique-id", "title": "Short task name", "description": "What this task does - be specific to their workspace", "frequency": "Daily|Weekly|Bi-weekly|Monthly|Per event|Continuous"}]}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      let jsonText = content.text.trim();

      // Extract JSON from markdown code blocks if present
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const result = JSON.parse(jsonText);
      return NextResponse.json(result);
    }

    throw new Error("Unexpected response format");
  } catch (error) {
    console.error("Task suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to generate task suggestions" },
      { status: 500 }
    );
  }
}
