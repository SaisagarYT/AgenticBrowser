"use strict";

import dotenv from "dotenv";
dotenv.config();

const model = process.env.AGENTIC_BROWSER_TEXT_MODEL || "nvidia/nemotron-3-ultra-550b-a55b";
const baseUrl = process.env.AGENTIC_BROWSER_TEXT_BASE_URL || "https://integrate.api.nvidia.com/v1";
const apiKey = process.env.AGENTIC_BROWSER_TEXT_API_KEY || process.env.NVIDIA_API_KEY || "";

console.log("==========================================");
console.log("🔍 AI Model Diagnostic Check");
console.log("==========================================");
console.log(`Base URL : ${baseUrl}`);
console.log(`Model    : ${model}`);
console.log(`API Key  : ${apiKey ? apiKey.substring(0, 10) + "..." : "NOT SET (Empty in .env)"}`);
console.log("------------------------------------------");

if (!apiKey) {
  console.log("❌ Result: The AI Model cannot work because AGENTIC_BROWSER_TEXT_API_KEY is empty in .env.");
  console.log("NVIDIA's API requires an API key for every request. Without it, NVIDIA returns 401 Unauthorized.");
  process.exit(0);
}

try {
  console.log("Sending test ping to NVIDIA NIM...");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with 'Model connection successful!'" }],
      max_tokens: 30,
    }),
  });

  console.log(`HTTP Status: ${response.status} ${response.statusText}`);
  const text = await response.text();

  if (response.ok) {
    console.log("✅ SUCCESS! The model responded:");
    console.log(text);
  } else {
    console.log("❌ FAILED! NVIDIA rejected the request with:");
    console.log(text);
  }
} catch (err) {
  console.log(`❌ Network Error: ${err.message}`);
}
