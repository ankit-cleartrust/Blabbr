interface LoginResponse {
  success?: boolean
  token?: string
  accessToken?: string
  user?: {
    id: string
    name: string
    email: string
    image?: string
  }
  id?: string
  name?: string
  email?: string
  image?: string
}

export async function loginWithCredentials(email: string, password: string): Promise<LoginResponse | null> {
  try {
    const response = await fetch("https://backend.openivt.ai/admin/user/ext/login", {
      method: "POST",
      headers: {
        Origin: "https://wolfv3.replit.app",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!response.ok) {
      console.error("Login API error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error response:", errorText)
      return null
    }

    const data = await response.json()
    console.log("Login API response:", data)

    return data
  } catch (error) {
    console.error("Login API network error:", error)
    return null
  }
}

export function validateLoginResponse(data: LoginResponse): boolean {
  return !!(data.success || data.token || data.accessToken || data.user)
}
