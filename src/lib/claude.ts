import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeCompany(url: string, companyName: string) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this company and provide insights for a team management AI agent platform.

Company Name: ${companyName}
Website URL: ${url}

Based on the company name and URL, provide a JSON response with:
1. A brief description of what the company likely does (2-3 sentences)
2. The industry/sector they operate in
3. Suggested AI agents that would help this type of company

Respond ONLY with valid JSON in this exact format:
{
  "name": "${companyName}",
  "description": "Brief description of the company based on the URL and name",
  "industry": "Industry name",
  "suggestedAgents": [
    {
      "name": "Team Pulse",
      "description": "Weekly digest of team activity across Slack, email, and project tools",
      "available": true
    },
    {
      "name": "Sales Agent",
      "description": "Track deals, follow-ups, and pipeline health",
      "available": false
    },
    {
      "name": "Support Agent",
      "description": "Monitor customer issues and response times",
      "available": false
    }
  ]
}

The "Team Pulse" agent should always be first and marked as available (true).
Other agents should be marked as not available (false) - they are coming soon.
Customize the agent suggestions based on what would be most useful for this type of company.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    try {
      return JSON.parse(content.text);
    } catch {
      throw new Error("Failed to parse Claude response as JSON");
    }
  }

  throw new Error("Unexpected response format from Claude");
}

export async function generateDigest(
  slackMessages: Array<{ channel: string; user: string; text: string; timestamp: string }>,
  companyContext: { name: string; industry: string }
) {
  const messagesText = slackMessages
    .map((m) => `[${m.channel}] ${m.user}: ${m.text}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an AI assistant helping ${companyContext.name}, a company in the ${companyContext.industry} industry.

Generate a weekly team pulse digest based on these Slack messages from the past week:

${messagesText}

Create a digest with:
1. A brief executive summary (2-3 sentences)
2. Key topics discussed (3-5 bullet points)
3. Notable highlights or wins
4. Potential concerns or blockers to address
5. Recommended focus areas for next week

Format the response as JSON:
{
  "summary": "Executive summary here",
  "keyTopics": ["topic 1", "topic 2", "topic 3"],
  "highlights": ["highlight 1", "highlight 2"],
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "generatedAt": "${new Date().toISOString()}"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    try {
      return JSON.parse(content.text);
    } catch {
      throw new Error("Failed to parse digest response as JSON");
    }
  }

  throw new Error("Unexpected response format from Claude");
}
