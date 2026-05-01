import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, companyName, industry } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are helping create an automated task for a management tool.

Company: ${companyName || "Unknown"}
Industry: ${industry || "Unknown"}

The user wants to create a task based on this description:
"${prompt}"

Create a single automated task that addresses what they're asking for. The task should be something that can be automated by analyzing Slack messages, tracking patterns, or generating reports.

IMPORTANT: Output ONLY raw JSON, no markdown, no code blocks:
{"title": "Short task name (max 5 words)", "description": "What this task does in 1-2 sentences", "frequency": "Daily|Weekly|Bi-weekly|Monthly|Per event|Continuous"}`,
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

      const task = JSON.parse(jsonText);
      return NextResponse.json({ task });
    }

    throw new Error("Unexpected response format");
  } catch (error) {
    console.error("Task generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate task" },
      { status: 500 }
    );
  }
}
