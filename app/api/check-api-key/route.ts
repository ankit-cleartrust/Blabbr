import { NextResponse } from "next/server"

export const runtime = "nodejs" // Force Node.js runtime

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "OpenAI API key is missing. Please add your API key in the environment variables.",
        },
        { status: 200 },
      )
    }

    // Check if the API key format is valid (starts with "sk-" and has sufficient length)
    if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
      return NextResponse.json(
        {
          status: "error",
          message: "OpenAI API key appears to be invalid. Please check your API key format.",
        },
        { status: 200 },
      )
    }

    return NextResponse.json(
      {
        status: "success",
        message: "OpenAI API key is configured correctly.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error checking API key:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "An error occurred while checking the API key.",
      },
      { status: 500 },
    )
  }
}
