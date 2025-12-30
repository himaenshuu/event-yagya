import type { VercelRequest, VercelResponse } from "@vercel/node";
import argon2 from "argon2";
import { randomBytes } from "crypto";

// Simple rate limiting for auth attempts
const authAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_AUTH_ATTEMPTS = 10;
const AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes

function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const realIP = req.headers["x-real-ip"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (typeof realIP === "string") {
    return realIP;
  }

  return "unknown";
}

function checkAuthRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = authAttempts.get(ip);

  if (!record || now > record.resetTime) {
    const resetTime = now + AUTH_WINDOW;
    authAttempts.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_AUTH_ATTEMPTS - 1, resetTime };
  }

  if (record.count >= MAX_AUTH_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: MAX_AUTH_ATTEMPTS - record.count,
    resetTime: record.resetTime,
  };
}

// Generate a simple session token using crypto randomBytes
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
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

  const clientIP = getClientIP(req);

  // Check rate limit
  const rateLimit = checkAuthRateLimit(clientIP);

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil(
      (rateLimit.resetTime - Date.now()) / 1000 / 60
    );
    return res.status(429).json({
      error: "Too many authentication attempts",
      message: `Please try again in ${retryAfter} minutes`,
      retryAfter,
    });
  }

  try {
    const { password } = req.body;

    // Validate password
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Password is required" });
    }

    // Normalize input to avoid accidental whitespace mismatches
    const normalizedPassword = password.trim();
    if (normalizedPassword.length === 0) {
      return res.status(400).json({ error: "Password cannot be empty" });
    }

    // Check if admin password hash is configured
    if (!process.env.ADMIN_PASSWORD_HASH) {
      console.error("ADMIN_PASSWORD_HASH not configured");
      return res.status(500).json({ error: "Authentication not configured" });
    }

    // Verify password using argon2
    const isValid = await argon2.verify(
      process.env.ADMIN_PASSWORD_HASH,
      normalizedPassword
    );

    if (isValid) {
      // Success - generate session token
      const sessionToken = generateSessionToken();

      // In production, you might want to store this token in Redis/KV
      // For now, we'll just return it and let client store it
      return res.status(200).json({
        success: true,
        sessionToken,
        message: "Authentication successful",
      });
    } else {
      // Failed authentication
      return res.status(401).json({
        error: "Invalid password",
        remaining: rateLimit.remaining,
      });
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
