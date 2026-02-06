// lib/client.ts

export type ClientOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  formData?: boolean;
  signal?: AbortSignal;
};

const BASE_URL = "/api/v1";

export async function client(
  url: string,
  options: ClientOptions = {}
) {
  const { method = "POST", body, headers = {}, formData, signal } = options;
  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...headers,
    },
    signal,
  };

  if (formData && body instanceof FormData) {
    fetchOptions.body = body;
    // Don't set Content-Type for FormData; browser will set it
  } else if (body) {
    fetchOptions.body = JSON.stringify(body);
    fetchOptions.headers = {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    };
  }

  const res = await fetch(`${BASE_URL}${url}`, fetchOptions);
  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  if (!res.ok) {
    throw { status: res.status, data };
  }
  return data;
}
