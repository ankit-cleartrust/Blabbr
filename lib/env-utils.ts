/**
 * Utility functions for accessing environment variables
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

/**
 * Safely get an environment variable
 * @param key The environment variable key
 * @param defaultValue Optional default value if not found
 * @returns The environment variable value or default
 */
export function getEnvVar(key: string, defaultValue = ""): string {
  // Server-side: Access from process.env
  if (!isBrowser) {
    return process.env[key] || defaultValue
  }

  // Client-side: Only access NEXT_PUBLIC_ variables
  if (key.startsWith("NEXT_PUBLIC_")) {
    return process.env[key] || defaultValue
  }

  // For security, don't allow access to non-public env vars on client
  return defaultValue
}

/**
 * Get the OpenAI API key (server-side only)
 * @returns The OpenAI API key
 */
export function getOpenAIApiKey(): string {
  const apiKey = getEnvVar("OPENAI_API_KEY")
  if (!apiKey && !isBrowser) {
    console.warn("OPENAI_API_KEY is not set in environment variables")
  }
  return apiKey
}

/**
 * Validate that required environment variables are set
 * @returns True if all required variables are set
 */
export function validateEnvVars(): boolean {
  if (isBrowser) return true // Skip validation in browser

  const required = ["OPENAI_API_KEY"]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`)
    return false
  }

  return true
}
