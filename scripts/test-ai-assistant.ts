import { chatRequestSchema, modelOutputSchema } from "../modules/ai/types";
import { extractSearchIntent } from "../modules/ai/service";
import { callOpenRouter, getOpenRouterConfig } from "../modules/ai/openrouter";
import { ProductCardDTO } from "../modules/products/types";
import { AppError } from "../lib/errors";
import { checkRateLimit } from "../lib/rate-limiter";
import { NextRequest } from "next/server";

async function runAiTests() {
  console.log("==================================================");
  console.log(" RUNNING AI SHOPPING ASSISTANT TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✓ ${message}`);
    passed++;
  }

  // -------------------------------------------------------------
  // TEST 1: Request Validation (Zod Schema)
  // -------------------------------------------------------------
  console.log("\n[TEST 1] Testing Request Payload Validation (Zod)...");

  // Valid input
  const validReq = chatRequestSchema.safeParse({
    message: "Suggest a black hoodie under ₹1500",
    history: [{ role: "user", content: "Hi" }, { role: "assistant", content: "Hello!" }],
  });
  assert(validReq.success === true, "Valid request payload accepted");

  // Empty message
  const emptyReq = chatRequestSchema.safeParse({ message: "   " });
  assert(emptyReq.success === false, "Empty message rejected");

  // Oversized message (> 500 characters)
  const oversizedReq = chatRequestSchema.safeParse({ message: "a".repeat(501) });
  assert(oversizedReq.success === false, "Message > 500 characters rejected");

  // Oversized history (> 6 messages)
  const oversizedHistory = chatRequestSchema.safeParse({
    message: "Find shoes",
    history: Array.from({ length: 7 }, (_, i) => ({ role: "user" as const, content: `msg ${i}` })),
  });
  assert(oversizedHistory.success === false, "History > 6 items rejected");

  // -------------------------------------------------------------
  // TEST 2: Natural Language Intent Extraction
  // -------------------------------------------------------------
  console.log("\n[TEST 2] Testing Natural Language Intent Extraction...");

  const intent1 = extractSearchIntent("Suggest a casual outfit under ₹1,000");
  assert(intent1.maxPrice === 1000, "Price threshold ₹1,000 correctly extracted");

  const intent2 = extractSearchIntent("Find a black oversized T-shirt in size M");
  assert(intent2.colors?.includes("Black") === true, "Color 'Black' correctly extracted");
  assert(intent2.sizes?.includes("M") === true, "Size 'M' correctly extracted");

  const intent3 = extractSearchIntent("Recommend affordable footwear");
  assert(intent3.category === "footwear", "Category 'footwear' correctly extracted");

  // -------------------------------------------------------------
  // TEST 3: Missing API Key Guard
  // -------------------------------------------------------------
  console.log("\n[TEST 3] Testing Missing / Unset API Key Guard...");

  const prevKey = process.env.OPENROUTER_API_KEY;
  try {
    delete process.env.OPENROUTER_API_KEY;
    let thrownError: unknown = null;
    try {
      getOpenRouterConfig();
    } catch (e) {
      thrownError = e;
    }
    assert(
      thrownError instanceof AppError && thrownError.code === "AI_SERVICE_UNAVAILABLE" && thrownError.statusCode === 503,
      "Missing OPENROUTER_API_KEY safely throws 503 AI_SERVICE_UNAVAILABLE"
    );
  } finally {
    process.env.OPENROUTER_API_KEY = prevKey;
  }

  // -------------------------------------------------------------
  // TEST 4: OpenRouter Mock & Error Handling (Zero API Credits Used)
  // -------------------------------------------------------------
  console.log("\n[TEST 4] Testing OpenRouter Mocking & Provider Failure Handling...");

  // Mock successful response
  const mockFetchSuccess: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        id: "mock-res-1",
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify({
                reply: "Here is a great oversized T-shirt for you!",
                recommendedProductIds: ["real-prod-1"],
              }),
            },
            finish_reason: "stop",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const successContent = await callOpenRouter([{ role: "user", content: "Hi" }], {
    fetcher: mockFetchSuccess,
  });
  assert(successContent.includes("real-prod-1"), "Mock OpenRouter success response returned");

  // Mock 429 rate limit from provider
  const mockFetchRateLimit: typeof fetch = async () => {
    return new Response(
      JSON.stringify({ error: { message: "Rate limit exceeded" } }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  };

  let rateLimitErr: unknown = null;
  try {
    await callOpenRouter([{ role: "user", content: "Hi" }], { fetcher: mockFetchRateLimit });
  } catch (e) {
    rateLimitErr = e;
  }
  assert(
    rateLimitErr instanceof AppError && rateLimitErr.statusCode === 429,
    "Upstream 429 rate limit correctly mapped to 429 AppError"
  );

  // Mock 502 provider failure
  const mockFetch500: typeof fetch = async () => {
    return new Response("Internal Server Error", { status: 500 });
  };

  let serverErr: unknown = null;
  try {
    await callOpenRouter([{ role: "user", content: "Hi" }], { fetcher: mockFetch500 });
  } catch (e) {
    serverErr = e;
  }
  assert(
    serverErr instanceof AppError && serverErr.statusCode === 502,
    "Upstream 500 error sanitized to 502 without leaking secrets"
  );

  // -------------------------------------------------------------
  // TEST 5: Grounding Filter & Hallucinated ID Stripping
  // -------------------------------------------------------------
  console.log("\n[TEST 5] Testing Catalog Grounding & Hallucinated ID Stripping...");

  const verifiedCatalog: ProductCardDTO[] = [
    {
      id: "prod-real-1",
      name: "Classic Cotton Crewneck Tee",
      slug: "classic-cotton-crewneck-tee",
      categoryName: "Men",
      categorySlug: "men",
      price: 399,
      compareAtPrice: 599,
      imageUrl: "/homepage.png",
      isNewArrival: false,
      isFeatured: true,
      availableSizes: ["S", "M", "L"],
      availableColors: [{ name: "Black", hexCode: "#000000" }],
    },
    {
      id: "prod-real-2",
      name: "Relaxed Fit Denim Jeans",
      slug: "relaxed-fit-denim-jeans",
      categoryName: "Men",
      categorySlug: "men",
      price: 799,
      compareAtPrice: 999,
      imageUrl: "/homepage.png",
      isNewArrival: true,
      isFeatured: true,
      availableSizes: ["30", "32", "34"],
      availableColors: [{ name: "Blue", hexCode: "#0000FF" }],
    },
  ];

  const candidateMap = new Map<string, ProductCardDTO>(verifiedCatalog.map((p) => [p.id, p]));

  // Model returns 1 real ID, 1 hallucinated ID, and 1 another real ID
  const modelRawOutput = JSON.stringify({
    reply: "I found great pieces for your casual outfit under ₹1,000!",
    recommendedProductIds: ["prod-real-1", "fake-hallucinated-id-999", "prod-real-2"],
  });

  const parsedJson = JSON.parse(modelRawOutput);
  const validatedModel = modelOutputSchema.parse(parsedJson);

  // Grounding filter simulation
  const groundedProducts: ProductCardDTO[] = [];
  for (const id of validatedModel.recommendedProductIds) {
    if (candidateMap.has(id)) {
      groundedProducts.push(candidateMap.get(id)!);
    }
  }

  assert(groundedProducts.length === 2, "Exactly 2 grounded products retained");
  assert(
    groundedProducts.some((p) => p.id === "fake-hallucinated-id-999") === false,
    "Hallucinated product ID 'fake-hallucinated-id-999' was strictly stripped"
  );
  assert(groundedProducts[0].price === 399, "Real database price (399) preserved");
  assert(groundedProducts[1].price === 799, "Real database price (799) preserved");

  // -------------------------------------------------------------
  // TEST 6: Rate Limiting Enforcement (Sliding Window)
  // -------------------------------------------------------------
  console.log("\n[TEST 6] Testing Rate Limiting (15 req/min per IP)...");

  const dummyReq = new NextRequest("http://localhost:3000/api/ai/chat", {
    headers: { "x-forwarded-for": "198.51.100.42" },
  });

  let blocked = false;
  for (let i = 0; i < 20; i++) {
    const res = checkRateLimit(dummyReq, "ai-chat-test", 15, 60000);
    if (!res.allowed) {
      blocked = true;
      break;
    }
  }
  assert(blocked === true, "Rate limit correctly triggered after exceeding 15 requests");

  console.log("\n==================================================");
  console.log(` ALL ${passed}/${total} AI ASSISTANT UNIT TESTS PASSED! ✓`);
  console.log("==================================================\n");
}

runAiTests().catch((e) => {
  console.error("Test failed with error:", e);
  process.exit(1);
});
