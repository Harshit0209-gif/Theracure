require("dotenv").config();

console.log("\n🔍 Testing Cloudflare R2 Configuration...\n");
console.log("═══════════════════════════════════════════\n");

const checks = {
  "Storage Provider Set": {
    test: process.env.STORAGE_PROVIDER === "cloudflare-r2",
    value: process.env.STORAGE_PROVIDER,
    expected: "cloudflare-r2",
  },
  "R2 Endpoint Configured": {
    test: !!process.env.CLOUDFLARE_R2_ENDPOINT,
    value: process.env.CLOUDFLARE_R2_ENDPOINT ? "✓ Set" : "✗ Missing",
    expected: "Should be: https://{account-id}.r2.cloudflarestorage.com",
  },
  "Bucket Name Set": {
    test: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
    value: process.env.CLOUDFLARE_R2_BUCKET_NAME || "✗ Missing",
    expected: "Your bucket name",
  },
  "Access Key ID Set": {
    test: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    value: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
      ? `${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID.substring(0, 8)}...`
      : "✗ Missing",
    expected: "R2 Access Key ID",
  },
  "Secret Access Key Set": {
    test: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    value: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
      ? "****** (hidden)"
      : "✗ Missing",
    expected: "R2 Secret Access Key",
  },
  "NextAuth URL Set": {
    test: !!process.env.NEXTAUTH_URL,
    value: process.env.NEXTAUTH_URL || "✗ Missing",
    expected: "http://localhost:3001 (for local)",
  },
  "Database URL Set": {
    test: !!process.env.DATABASE_URL,
    value: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
    expected: "PostgreSQL connection string",
  },
};

let passedCount = 0;
let failedCount = 0;

Object.entries(checks).forEach(([name, config]) => {
  const icon = config.test ? "✅" : "❌";
  if (config.test) passedCount++;
  else failedCount++;

  console.log(`${icon} ${name}`);
  console.log(`   Current: ${config.value}`);
  if (!config.test) {
    console.log(`   Expected: ${config.expected}`);
  }
  console.log("");
});

console.log("═══════════════════════════════════════════\n");

if (failedCount === 0) {
  console.log("✅ All checks passed! Your configuration looks good!");
  console.log("\n📋 Next steps:");
  console.log("   1. Run: pnpm dev");
  console.log(
    "   2. Check terminal for: [Storage Factory] Initializing storage provider: cloudflare-r2"
  );
  console.log("   3. Test file upload via the UI");
  console.log("   4. Verify files appear in Cloudflare R2 dashboard\n");
} else {
  console.log(`❌ ${failedCount} check(s) failed!`);
  console.log("\n📝 Action required:");
  console.log("   1. Update your .env file with the missing values");
  console.log("   2. Run this script again to verify");
  console.log("   3. See .env.cloudflare-r2.example for reference\n");
}

// Additional endpoint validation
if (process.env.CLOUDFLARE_R2_ENDPOINT) {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  if (!endpoint.includes(".r2.cloudflarestorage.com")) {
    console.log("⚠️  WARNING: Endpoint format looks incorrect!");
    console.log(`   Current: ${endpoint}`);
    console.log(
      "   Expected format: https://{account-id}.r2.cloudflarestorage.com\n"
    );
  }
}
