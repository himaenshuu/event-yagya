import argon2 from "argon2";

// Helper script to generate admin password hash using argon2
// Usage: node scripts/generate-password-hash.js YourPassword

const password = process.argv[2];

if (!password) {
  console.error(" Error: Please provide a password");
  console.log("Usage: node scripts/generate-password-hash.js YourPassword");
  process.exit(1);
}

(async () => {
  try {
    // Use argon2id (recommended variant) with secure defaults
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    console.log("\nPassword Hash Generated (Argon2):");
    console.log("─".repeat(70));
    console.log(`Password: ${password}`);
    console.log(`Argon2:   ${hash}`);
    console.log("─".repeat(70));
    console.log("\n Add this to your .env.local file:");
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log("\n Add this to Vercel environment variables:");
    console.log(`Name:  ADMIN_PASSWORD_HASH`);
    console.log(`Value: ${hash}`);
    console.log("");
  } catch (error) {
    console.error("Error generating hash:", error.message);
    process.exit(1);
  }
})();
