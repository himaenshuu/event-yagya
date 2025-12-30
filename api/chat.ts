import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per IP
const MAX_MESSAGE_LENGTH = 500; // Maximum message length

// In-memory rate limit store (resets on cold starts)
// For production, consider using Redis/Upstash for persistent storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically to prevent memory leaks
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Check rate limit for an IP address
function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  cleanupRateLimitStore();

  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // First request or window expired - create new record
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime };
  }

  // Window still active
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetTime: record.resetTime,
  };
}

// Get client IP address
function getClientIP(req: VercelRequest): string {
  // Vercel provides IP in x-forwarded-for or x-real-ip headers
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (typeof realIP === "string") {
    return realIP;
  }

  // Fallback (should rarely happen on Vercel)
  return "unknown";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get client IP for rate limiting
  const clientIP = getClientIP(req);

  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader("X-RateLimit-Remaining", rateLimit.remaining.toString());
  res.setHeader(
    "X-RateLimit-Reset",
    new Date(rateLimit.resetTime).toISOString()
  );

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    res.setHeader("Retry-After", retryAfter.toString());
    return res.status(429).json({
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    });
  }

  try {
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // Validate message length
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: "Message too long",
        message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less`,
      });
    }

    // Sanitize message (prevent injection attacks)
    const sanitizedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return res.status(500).json({
        error: "API key not configured",
        message: "Please add GEMINI_API_KEY to Vercel environment variables",
      });
    }

    // Create the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Event context for the chatbot
    const eventContext = `You are a helpful assistant for the Maha Satchandi Mahayagya event. 
    This is a spiritual event with donations, schedules, and updates. 
    Answer questions about the event, donation process, schedules, and general information.
    Keep responses concise and helpful.`;

    // Generate response
    const result = await model.generateContent(
      `${eventContext}\n\nUser: ${sanitizedMessage}`
    );
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ response: text });
  } catch (error) {
    console.error("Gemini API error:", error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return res.status(500).json({
      error: "Failed to generate response",
      details: error instanceof Error ? error.message : "Unknown error",
      apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    });
  }
}
