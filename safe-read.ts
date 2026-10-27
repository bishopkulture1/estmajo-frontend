// Retry only idempotent public/session reads while the free server wakes up.
// Never retry login, uploads, enquiries, or content writes automatically.
export async function safeRead(url: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let transient = false;
    try {
      const response = await fetch(url, {
        credentials: "same-origin", cache: "no-store",
        signal: AbortSignal.timeout(35000),
      });
      if ([502, 503, 504, 408].includes(response.status)) transient = true;
      else if (!response.ok) throw new Error("Unable to read company data. Please try again later.");
      else {
        // A sleeping host can respond with an HTML loading page.
        if (response.headers.get("content-type")?.includes("application/json")) return await response.json();
        transient = true;
      }
    } catch (error) {
      if (error instanceof TypeError || (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name))) transient = true;
      else throw error;
    }
    if (transient && attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500));
  }
  throw new Error("The company server is still starting or temporarily unavailable. Please try again shortly.");
}
