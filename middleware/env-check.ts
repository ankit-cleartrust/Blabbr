import { validateEnvVars } from "@/lib/env-utils"

// Run this once during app initialization
export function initEnvironment() {
  // Validate required environment variables
  const isValid = validateEnvVars()

  if (!isValid) {
    console.warn(
      "Some required environment variables are missing. " +
        "The app may not function correctly. " +
        "See .env.example for required variables.",
    )
  }
}
