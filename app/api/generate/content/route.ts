import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { ContentType } from "@/lib/types"

export const runtime = "nodejs" // Force Node.js runtime

export async function POST(request: Request) {
  try {
    const { topic, contentType } = await request.json()

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
    if (!topic || !topic.title || !topic.keywords || !contentType) {
      console.error("Invalid request data:", { topic, contentType })
      return NextResponse.json(
        { error: "⚠️ Invalid request data. Topic and content type are required." },
        { status: 400 },
      )
    }

    // Generate a random seed for variation
    const seed = Math.floor(Math.random() * 1000)
    const timestamp = new Date().getTime()

    const promptMap: Record<ContentType, string> = {
      blog: `Write a UNIQUE and SEO-optimized blog post about "${topic.title}" for a digital marketing audience.
Include the following keywords strategically: ${topic.keywords.join(", ")}.
The blog post should be informative, well-structured, and EXACTLY 200-400 words.
Include:
- An SEO-optimized headline with the main keyword
- Meta description-worthy introduction with primary keyword in first paragraph
- Proper H2 subheadings that include secondary keywords
- Bullet points or numbered lists for better readability
- A strong call-to-action conclusion
- Internal linking opportunities (mention phrases like "learn more about X in our guide")

IMPORTANT: 
- Keep the total word count between 200-400 words
- Maintain 2-3% keyword density without keyword stuffing
- Use short paragraphs and sentences for better readability
- Include questions that users might search for
- Make this content DIFFERENT from any previous content you've generated on this topic
- Variation seed: ${seed}
- Timestamp: ${timestamp}`,

      linkedin: `Create a UNIQUE and engaging LinkedIn post about "${topic.title}" for a professional audience.
Incorporate these keywords naturally: ${topic.keywords.join(", ")}.
The post should be concise (EXACTLY 150-200 words), engaging, and include:
- An attention-grabbing first line with emoji for higher engagement
- One primary keyword in the first sentence
- Data points or statistics to establish credibility
- A question to encourage comments and engagement
- 3-5 relevant hashtags including the keywords
- A clear call-to-action

IMPORTANT:
- Keep the total word count between 150-200 words
- Make it conversational yet professional
- Include one "hook" statistic or surprising fact
- Make this content COMPLETELY DIFFERENT from any previous content you've generated on this topic
- Variation seed: ${seed}
- Timestamp: ${timestamp}`,

      newsletter: `Draft a UNIQUE and engaging newsletter section about "${topic.title}" for marketing professionals.
Include these keywords strategically: ${topic.keywords.join(", ")}.
The newsletter should be informative yet accessible, EXACTLY 200-1000 words.
Include:
- A compelling headline with the primary keyword
- Subheadings that incorporate secondary keywords
- Data-driven insights and statistics
- A table or comparison for easy scanning
- Bullet points for key takeaways
- A numbered implementation plan or roadmap
- Expert quote or insight
- Next steps or call-to-action

IMPORTANT:
- Keep the total word count between 200-1000 words
- Use formatting to enhance readability (bold for key points)
- Include specific metrics or percentages to establish authority
- Address the "why this matters now" aspect
- Make this content COMPLETELY DIFFERENT from any previous content you've generated on this topic
- Variation seed: ${seed}
- Timestamp: ${timestamp}`,
    }

    try {
      // Generate content using the AI SDK
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: promptMap[contentType],
        system:
          "You are an expert content creator specializing in digital marketing, business growth, and content strategy. Create high-quality, SEO-optimized content that ranks well in search engines while providing valuable information to readers. Follow SEO best practices including proper keyword placement, optimal formatting for readability, and compelling meta-worthy descriptions. Always prioritize user intent and readability over keyword density. IMPORTANT: Each time you're asked to generate content, create something COMPLETELY DIFFERENT from previous generations, even if the topic is similar.",
        temperature: 0.9, // Higher temperature for more variation
        seed: seed, // Use a random seed for variation
        maxTokens: 1000, // Limit token usage to prevent timeouts
      })

      return NextResponse.json({ text })
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
        error: "⚠️ Failed to generate content. Please check your API key and try again.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
