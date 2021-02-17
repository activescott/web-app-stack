import fetch from "isomorphic-unfetch"

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const resp = await fetch(url, init)
  if (resp.ok) {
    return (await resp.json()) as T
  } else {
    throw new Error(
      `Unsuccessful HTTP response fetching ${url}: ${resp.status}: ${resp.statusText}`
    )
  }
}

export async function fetchText(
  url: string,
  init?: RequestInit
): Promise<string> {
  const resp = await fetch(url, init)
  if (resp.ok) {
    return await resp.text()
  } else {
    throw new Error(
      `Unsuccessful HTTP response fetching ${url}: ${resp.status}: ${resp.statusText}`
    )
  }
}

/**
 * Performs a standard fetch after requesting a CSRF token and adding it to the headers
 */
export async function fetchWithCsrf(
  url: string,
  init: RequestInit
): Promise<Response> {
  const token = await fetchText(`${process.env.PUBLIC_URL}/auth/csrf`)
  init = {
    ...init,
    headers: {
      ...(init.headers || {}),
      "x-csrf-token": token,
    },
  }
  return fetch(url, init)
}
