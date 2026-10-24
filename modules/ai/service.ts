import { getProducts } from "@/modules/products/service";
import { ProductCardDTO } from "@/modules/products/types";
import { callOpenRouter } from "./openrouter";
import {
  ChatRequestInput,
  ChatResponseData,
  OpenRouterMessage,
  modelOutputSchema,
} from "./types";

interface ParsedIntent {
  searchQuery?: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  sizes?: string[];
  colors?: string[];
}

const COMMON_COLORS = [
  "black",
  "white",
  "blue",
  "navy",
  "red",
  "green",
  "olive",
  "beige",
  "pink",
  "cream",
  "grey",
  "gray",
  "yellow",
  "brown",
];

const COMMON_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
];

const CATEGORY_MAP: Record<string, string> = {
  men: "men",
  menswear: "men",
  man: "men",
  women: "women",
  womenswear: "women",
  woman: "women",
  kid: "kids",
  kids: "kids",
  children: "kids",
  child: "kids",
  footwear: "footwear",
  shoes: "footwear",
  sneaker: "footwear",
  sneakers: "footwear",
  loafers: "footwear",
  sliders: "footwear",
};

/**
 * Extract search intent from natural language user input.
 */
export function extractSearchIntent(message: string): ParsedIntent {
  const lower = message.toLowerCase();
  const intent: ParsedIntent = {};

  // 1. Detect Price constraints (e.g. "under ₹1000", "below 800", "under 1,000", "under 500")
  const underPriceMatch = lower.match(/(?:under|below|less than|within|max|budget of)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
  if (underPriceMatch) {
    const rawNum = underPriceMatch[1].replace(/,/g, "");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      intent.maxPrice = parsed;
    }
  }

  // 2. Detect Category
  for (const [key, catSlug] of Object.entries(CATEGORY_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(lower)) {
      intent.category = catSlug;
      break;
    }
  }

  // 3. Detect Sizes
  const detectedSizes: string[] = [];
  for (const size of COMMON_SIZES) {
    // Match isolated size words like "size M", "size 32", "in M"
    const sizeRegex = new RegExp(`(?:size|in)\\s+${size}\\b|\\b${size}\\s+size\\b`, "i");
    if (sizeRegex.test(message)) {
      detectedSizes.push(size);
    }
  }
  if (detectedSizes.length > 0) {
    intent.sizes = detectedSizes;
  }

  // 4. Detect Colors
  const detectedColors: string[] = [];
  for (const color of COMMON_COLORS) {
    const colorRegex = new RegExp(`\\b${color}\\b`, "i");
    if (colorRegex.test(lower)) {
      detectedColors.push(color.charAt(0).toUpperCase() + color.slice(1));
    }
  }
  if (detectedColors.length > 0) {
    intent.colors = detectedColors;
  }

  // 5. Clean search keywords by stripping conversational filler words
  const cleanedQuery = lower
    .replace(/(?:suggest|find|recommend|show me|look for|searching for|give me|what do you have in|i want|i am looking for|i need|can you show)\b/gi, "")
    .replace(/(?:under|below|less than|within|max|budget of)\s*(?:₹|rs\.?|inr)?\s*[0-9,]+/gi, "")
    .replace(/\b(?:size|in size)\s+[a-z0-9]+/gi, "")
    .replace(/\b(?:casual|outfit|affordable|best|cheap|good|trending|latest|style|styles|wear|clothing|options)\b/gi, "")
    .trim();

  if (cleanedQuery.length > 2) {
    intent.searchQuery = cleanedQuery;
  }

  return intent;
}

/**
 * Retrieve verified candidate products from real database based on user intent.
 */
export async function getCandidateProducts(intent: ParsedIntent): Promise<ProductCardDTO[]> {
  try {
    // First attempt: search with extracted filters
    const primaryResult = await getProducts({
      search: intent.searchQuery,
      category: intent.category,
      maxPrice: intent.maxPrice,
      minPrice: intent.minPrice,
      sizes: intent.sizes,
      colors: intent.colors,
      limit: 10,
      sort: intent.maxPrice ? "price_asc" : "featured",
    });

    if (primaryResult.products.length > 0) {
      return primaryResult.products;
    }

    // Fallback: If very specific keywords yielded 0 results, relax search keyword but keep category or price
    if (intent.category || intent.maxPrice) {
      const relaxedResult = await getProducts({
        category: intent.category,
        maxPrice: intent.maxPrice,
        limit: 8,
        sort: "featured",
      });

      if (relaxedResult.products.length > 0) {
        return relaxedResult.products;
      }
    }

    // Final fallback: fetch general featured active products
    const generalResult = await getProducts({
      limit: 6,
      sort: "featured",
    });

    return generalResult.products;
  } catch (error) {
    console.error("[AI] Error querying candidate catalog:", error);
    return [];
  }
}

/**
 * Handle AI shopping assistant conversation grounded strictly in real database products.
 */
export async function handleAiShoppingChat(input: ChatRequestInput): Promise<ChatResponseData> {
  const userMessage = input.message.trim();
  const history = input.history || [];

  // 1. Extract search intent
  const intent = extractSearchIntent(userMessage);

  // 2. Query real database candidates
  const candidates = await getCandidateProducts(intent);

  // Create an indexed map of verified database products for strict validation
  const candidateMap = new Map<string, ProductCardDTO>();
  candidates.forEach((p) => candidateMap.set(p.id, p));

  // If catalog is completely empty
  if (candidates.length === 0) {
    return {
      message:
        "I couldn't find any products in our catalog matching your request right now. You can explore our Men, Women, Kids, or Footwear collections from the navigation menu above!",
      products: [],
    };
  }

  // 3. Prepare compact catalog representation for the model
  const catalogPayload = candidates.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.categoryName,
    price: `₹${p.price}`,
    sizes: p.availableSizes.slice(0, 5),
    colors: p.availableColors.map((c) => c.name).slice(0, 3),
  }));

  // 4. Construct System & Context Messages for Gemma 4
  const systemPrompt = `You are the AI Shopping Assistant for ZOA Digital Commerce, an everyday fashion brand.
Your goal is to assist customers warmly, concisely, and help them find clothing from our real catalog.

CRITICAL RULES:
1. Grounding: You must ONLY recommend products from the provided "REAL CATALOG CANDIDATES". Never invent, assume, or hallucinate products, prices, discounts, or sizes that are not in the list.
2. Output format: You must respond in valid JSON with exactly two fields:
   {
     "reply": "Conversational, helpful, and concise response in 1-3 sentences.",
     "recommendedProductIds": ["id1", "id2"]
   }
3. Product IDs: Include between 1 and 3 product IDs in "recommendedProductIds" that best match the customer's request. Only use exact "id" strings from the provided list.
4. If none of the candidates match what the customer asked for, apologize politely, set "recommendedProductIds" to [], and suggest alternative search terms (e.g. Men, Women, Kids, Footwear).`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  // Include bounded conversation history (user & assistant turns)
  for (const h of history.slice(-4)) {
    messages.push({
      role: h.role,
      content: h.content,
    });
  }

  // Add the current user query accompanied by verified catalog candidates
  messages.push({
    role: "user",
    content: `Customer Query: "${userMessage}"

REAL CATALOG CANDIDATES:
${JSON.stringify(catalogPayload, null, 2)}

Respond with a JSON object containing "reply" and "recommendedProductIds".`,
  });

  // 5. Call OpenRouter
  let modelRawText = "";
  try {
    modelRawText = await callOpenRouter(messages, {
      temperature: 0.1,
      maxTokens: 500,
      responseFormatJson: true,
    });
  } catch (error) {
    console.error("[AI] OpenRouter invocation failed:", error);
    // Graceful fallback: return top candidates directly with friendly message if model provider fails
    const fallbackProducts = candidates.slice(0, 3);
    return {
      message:
        "Here are a few popular selections from our everyday fashion collection that might match what you're looking for:",
      products: fallbackProducts,
    };
  }

  // 6. Parse and strictly validate model output (Untrusted Input)
  let parsedReply = "Here are our top recommendations for you:";
  let rawProductIds: string[] = [];

  try {
    // Strip markdown JSON code fence if present
    const cleanedJson = modelRawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const jsonParsed = JSON.parse(cleanedJson);
    const validated = modelOutputSchema.safeParse(jsonParsed);

    if (validated.success) {
      parsedReply = validated.data.reply || parsedReply;
      rawProductIds = validated.data.recommendedProductIds || [];
    }
  } catch (parseError) {
    console.warn("[AI] Failed to parse model output as JSON, attempting text recovery:", parseError);
    parsedReply = modelRawText;
  }

  // 7. Grounding filter: Validate every product ID against the retrieved database candidate set
  const validatedProducts: ProductCardDTO[] = [];
  const seenIds = new Set<string>();

  for (const id of rawProductIds) {
    if (typeof id === "string" && candidateMap.has(id) && !seenIds.has(id)) {
      validatedProducts.push(candidateMap.get(id)!);
      seenIds.add(id);
      if (validatedProducts.length >= 4) break;
    }
  }

  // If model returned recommendations but none had valid IDs, supply top 2 relevant candidates
  if (validatedProducts.length === 0 && candidates.length > 0 && !parsedReply.toLowerCase().includes("couldn't find")) {
    validatedProducts.push(...candidates.slice(0, 2));
  }

  return {
    message: parsedReply,
    products: validatedProducts,
  };
}
