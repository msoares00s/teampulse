import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Task {
  id: string;
  title: string;
  description: string;
  frequency: string;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("slack_access_token")?.value;

  try {
    const { task, companyName, channel, postToSlack } = await request.json();

    if (!task) {
      return NextResponse.json(
        { error: "Task is required" },
        { status: 400 }
      );
    }

    const taskData = task as Task;

    // Generate the task message using AI
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are executing an automated task for a team management tool.

Company: ${companyName || "the team"}
Task: ${taskData.title}
Description: ${taskData.description}
Frequency: ${taskData.frequency}
${channel ? `Target Channel: #${channel}` : ""}

Generate a professional, friendly message that accomplishes this task. The message should be:
- Actionable and specific
- Professional but warm
- Include any relevant reminders or follow-up items
- Be appropriate for posting in a team Slack channel

If this is a reminder/check-in task, phrase it as a gentle nudge that encourages response.
If this is a tracking task, include a format for people to respond with updates.

Write ONLY the message content, no explanations or formatting. Keep it concise (2-4 paragraphs max).`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const generatedMessage = content.text.trim();

    // If postToSlack is true and we have a channel, post the message
    let slackResult = null;
    if (postToSlack && channel && token) {
      // Find the channel ID
      const channelsResponse = await fetch(
        "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const channelsData = await channelsResponse.json();

      const channelName = channel.replace(/^#/, "");
      const targetChannel = channelsData.channels?.find(
        (c: { name: string }) => c.name === channelName
      );

      if (targetChannel) {
        const postResponse = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            channel: targetChannel.id,
            text: generatedMessage,
          }),
        });

        const postData = await postResponse.json();
        if (postData.ok) {
          slackResult = {
            success: true,
            channel: channelName,
            timestamp: postData.ts,
          };
        } else {
          slackResult = {
            success: false,
            error: postData.error,
          };
        }
      } else {
        slackResult = {
          success: false,
          error: `Channel #${channelName} not found`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      task: taskData,
      message: generatedMessage,
      slackResult,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Task execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute task" },
      { status: 500 }
    );
  }
}
