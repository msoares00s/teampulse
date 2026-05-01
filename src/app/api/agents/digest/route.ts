import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEMO_MESSAGES = [
  { channel: "#general", user: "Sarah", text: "Just shipped the new dashboard feature! It's live in production now.", ts: "2h ago" },
  { channel: "#engineering", user: "Mike", text: "Found a performance issue in the API - response times spiking to 2s. Need to investigate.", ts: "5h ago" },
  { channel: "#engineering", user: "Mike", text: "Fixed the performance issue! It was a missing database index. Down to 50ms now.", ts: "4h ago" },
  { channel: "#sales", user: "Lisa", text: "Closed the Acme Corp deal! $50k ARR. They want to start onboarding next week.", ts: "1d ago" },
  { channel: "#general", user: "Tom", text: "Reminder: All-hands meeting tomorrow at 3pm. We'll be discussing Q2 goals.", ts: "2d ago" },
  { channel: "#product", user: "Emma", text: "User research sessions went great! Key insight: customers want better mobile support.", ts: "3d ago" },
  { channel: "#engineering", user: "Sarah", text: "CI pipeline is flaky again. Third time this week. We should prioritize fixing this.", ts: "4d ago" },
  { channel: "#sales", user: "Lisa", text: "Pipeline looking strong for Q2. We have 5 deals in final negotiation stages.", ts: "5d ago" },
  { channel: "#product", user: "Tom", text: "Still waiting on legal review for the new terms of service. Been 2 weeks now.", ts: "3d ago" },
  { channel: "#engineering", user: "Mike", text: "Should we migrate to the new auth provider? Need a decision by Friday.", ts: "2d ago" },
];

export async function POST(request: NextRequest) {
  try {
    const { companyContext } = await request.json();
    const messagesText = DEMO_MESSAGES.map((m) => `[${m.channel}] ${m.user} (${m.ts}): ${m.text}`).join("\n");

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
