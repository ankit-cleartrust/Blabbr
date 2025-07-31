import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { KeywordData } from "@/lib/keywords"

export async function POST(request: Request) {
  try {
    const { topic, keywords, refreshCounter = 0 } = await request.json()

    // Check if OpenAI API key is available first
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI API key is missing")
      return NextResponse.json(
        { error: "⚠️ OpenAI API key is missing. Please add your API key in the environment variables." },
        { status: 500 },
      )
    }

    // Validate input data
    if (!topic || !keywords) {
      console.error("Invalid request data:", { topic, keywords })
      return NextResponse.json({ error: "⚠️ Invalid request data. Topic and keywords are required." }, { status: 400 })
    }

    // Generate a random seed for variation, incorporating the refresh counter
    const seed = Math.floor(Math.random() * 1000) + refreshCounter * 1000
    const timestamp = new Date().getTime()

    // Format keywords for the prompt
    const keywordsList = keywords
      .map((k: KeywordData) => k.keyword)
      .slice(0, 5)
      .join(", ")

    try {
      // Generate blog ideas using the AI SDK
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate 5 UNIQUE SEO-optimized content ideas about "${topic}" for a digital marketing audience.
Include these keywords where appropriate: ${keywordsList}.
Each idea should:
- Have a catchy, SEO-friendly title that would attract clicks and rank well
- Include numbers, questions, or brackets where appropriate
- Target high-intent search queries
- Address specific pain points or solutions
- Be specific and actionable

Format the output as a numbered list with just the titles.
Make the ideas specific, actionable, and relevant to current best practices in ${topic}.
Make these ideas DIFFERENT from any previous ideas you've generated on this topic.
Variation seed: ${seed}
Refresh counter: ${refreshCounter}
Timestamp: ${timestamp}`,
        system:
          "You are an expert SEO content strategist specializing in digital marketing, content creation, and business growth. Create compelling, clickable content ideas that would perform well in search results and social media. Focus on titles that would have high CTR in search results and address specific user intents. Include numbers, brackets, or questions where appropriate as these increase CTR. IMPORTANT: Each time you're asked to generate ideas, create something COMPLETELY DIFFERENT from previous generations, even if the topic is similar.",
        temperature: 0.9, // Higher temperature for more variation
        seed: seed, // Use a random seed for variation
      })

      // Parse the numbered list into an array of ideas
      const ideas = text
        .split("\n")
        .filter((line) => /^\d+\./.test(line)) // Lines starting with a number and period
        .map((line) => line.replace(/^\d+\.\s*/, "").trim()) // Remove the numbering

      return NextResponse.json({ ideas: ideas.length > 0 ? ideas : [text] })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Extract more detailed error information
      const errorMessage = openaiError?.message || "Unknown error occurred"
      const errorCode = openaiError?.code || "unknown_error"
      const errorStatus = openaiError?.status || 500

      return NextResponse.json(
        {
          error: `⚠️ Error calling OpenAI API: ${errorMessage}`,
          errorCode,
          details: openaiError instanceof Error ? openaiError.message : String(openaiError),
        },
        { status: errorStatus },
      )
    }
  } catch (error: any) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      {
        error: "⚠️ Failed to generate blog ideas. Please check your API key and try again.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
