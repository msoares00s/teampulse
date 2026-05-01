import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url, companyName } = await request.json();

    if (!url || !companyName) {
      return NextResponse.json(
        { error: "URL and company name are required" },
        { status: 400 }
      );
    }

    // First, try to fetch basic info from the URL
    let websiteContent = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        // Extract text content (basic extraction)
        websiteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 4000);
        console.log("Fetched website content:", websiteContent.substring(0, 200) + "...");
      } else {
        console.log("Website fetch failed with status:", response.status);
      }
    } catch (fetchError) {
      console.log("Could not fetch website:", fetchError);
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are analyzing a company to help personalize a management tool for them.

Company Name: ${companyName}
Website URL: ${url}
${websiteContent ? `\nContent from their website:\n${websiteContent}` : "\n(Could not fetch website content - analyze based on URL and company name)"}

Based on the information above, determine:
1. What does this company actually do? Be specific based on the website content.
2. What industry are they in? (e.g., "Events & Conferences", "SaaS", "Agency", "E-commerce")
3. What management challenges would they face?

Based on this specific company, suggest 4-6 automated tasks that would help their founder/manager stay on top of things. Be specific to their industry and business model.

IMPORTANT: Output ONLY raw JSON, no markdown, no code blocks, no explanation. Just the JSON object:

{"description": "2-3 sentence description of what this specific company does based on the website", "industry": "Specific industry name", "insights": ["Specific insight about their business model", "Challenge they likely face", "Key focus area for their type of business"], "suggestedTasks": [{"id": "unique-id", "title": "Task name", "description": "What this task does for them", "frequency": "Daily/Weekly/Per event/etc"}], "focusAreas": ["area1", "area2", "area3"]}`,
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

        const research = JSON.parse(jsonText);
        return NextResponse.json(research);
      } catch (parseError) {
        console.error("Failed to parse Claude response:", content.text);
        console.error("Parse error:", parseError);
        // Return a fallback response
        return NextResponse.json({
          description: `${companyName} is a company focused on delivering value to their customers.`,
          industry: "Business Services",
          insights: [
            "Regular team check-ins help maintain alignment",
            "Follow-up tracking prevents dropped balls",
            "Clear decision-making processes reduce bottlenecks",
          ],
          suggestedWorkflows: [
            { name: "Weekly Review", reason: "Keep the team aligned on priorities" },
            { name: "Follow-up Tracker", reason: "Ensure nothing falls through the cracks" },
          ],
          focusAreas: ["Team alignment", "Client delivery", "Growth"],
        });
      }
    }

    throw new Error("Unexpected response format from Claude");
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: "Failed to research company" },
      { status: 500 }
    );
  }
}
