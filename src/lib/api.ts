import { toast } from "sonner"

export class ApiError extends Error {
  constructor(
    public status: number, 
    message: string,
    public response?: { data?: any }
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>
}

export async function fetchApi<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  
  // Build query string from params
  let queryString = ""
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    let errorData: any = null
    
    try {
      errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // If response is not JSON, use default error message
    }
    
    const error = new ApiError(response.status, errorMessage, { data: errorData })
    throw error
  }

  // Handle empty response (204 No Content)
  if (response.status === 204) {
    return undefined as T
  }

  try {
    return await response.json()
  } catch {
    // If response is not JSON, return undefined
    return undefined as T
  }
}

// Convenience methods
export const api = {
  get: <T = unknown>(url: string, options?: FetchOptions) =>
    fetchApi<T>(url, { ...options, method: "GET" }),
    
  post: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(url, { ...options, method: "POST", body: JSON.stringify(data) }),
    
  put: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(url, { ...options, method: "PUT", body: JSON.stringify(data) }),
    
  patch: <T = unknown>(url: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(url, { ...options, method: "PATCH", body: JSON.stringify(data) }),
    
  delete: <T = unknown>(url: string, options?: FetchOptions) =>
    fetchApi<T>(url, { ...options, method: "DELETE" }),
}

// Error handler for mutations
export function handleMutationError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return "An unexpected error occurred"
}