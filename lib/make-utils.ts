/**
 * Creates a properly formatted payload for Make.com webhooks
 * @param data The data to send to Make
 * @param webhookUrl The Make webhook URL
 * @returns A payload with the required url parameter
 */
export function createMakePayload(data: any, webhookUrl: string): any {
  // If data is an object, add the url parameter at the top level
  if (typeof data === "object" && data !== null) {
    return {
      ...data,
      url: webhookUrl, // Add the required url parameter at the top level
    }
  }

  // If data is not an object, wrap it in an object with the url parameter
  return {
    data,
    url: webhookUrl,
  }
}
