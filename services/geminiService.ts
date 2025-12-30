// Gemini API is now secured via Vercel serverless function
// The API key is stored server-side and never exposed to the client
// Rate limiting: 10 requests per minute per IP address

const isDevelopment = import.meta.env.DEV;
const isLocalhost = () => {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

export async function askGeminiAboutEvent(question: string) {
  try {
    // Check if serverless function is available in development
    if (isDevelopment && isLocalhost()) {
      return `🔧 Development Mode: Gemini AI requires Vercel serverless functions.

To test locally with AI:
1. Install Vercel CLI: npm i -g vercel
2. Run: vercel dev
3. Access at http://localhost:3000

Or deploy to production to use the AI chatbot.`;
    }

    // Call the Vercel serverless API endpoint
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: question }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));

      // Handle rate limit errors specifically
      if (response.status === 429) {
        const retryAfter = errorData.retryAfter || 60;
        return `⏱️ You've reached the rate limit. Please wait ${retryAfter} seconds before asking another question. This helps us manage server costs and ensure fair access for everyone.`;
      }

      // Handle 404 (function not deployed)
      if (response.status === 404) {
        return `⚠️ AI chatbot is not available. The serverless function may not be deployed yet. Please deploy to Vercel or run 'vercel dev' locally.`;
      }

      // Handle other errors
      throw new Error(
        errorData.error || `API request failed: ${response.status}`
      );
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Gemini API Error:", error);
    }
    return "I'm sorry, I couldn't process your request at the moment. Please try again later.";
  }
}
