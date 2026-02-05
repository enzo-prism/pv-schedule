import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { fallbackMeets, getFallbackMeet } from "./fallback-data";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T,>({
  on401: unauthorizedBehavior,
}: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null as unknown as T;
      }

      await throwIfResNotOk(res);
      return (await res.json()) as T;
    } catch (error) {
      if (url === "/api/meets") {
        if (import.meta.env.DEV) {
          console.warn("Using fallback meet data for /api/meets", error);
        }
        return fallbackMeets as T;
      }

      if (url.startsWith("/api/meets/")) {
        const idPart = url.replace("/api/meets/", "").split(/[/?#]/)[0];
        const meetId = Number(idPart);
        if (Number.isFinite(meetId)) {
          const fallbackMeet = getFallbackMeet(meetId);
          if (fallbackMeet) {
            if (import.meta.env.DEV) {
              console.warn(`Using fallback meet data for /api/meets/${meetId}`, error);
            }
            return fallbackMeet as T;
          }
        }
      }

      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
