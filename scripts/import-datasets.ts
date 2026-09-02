import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma/client";
import bcrypt from "bcryptjs";

// City coordinates mapping for accurate Store Locator and Haversine distance
const CITY_COORDINATES: Record<string, { lat: number; lng: number; defaultState: string }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946, defaultState: "Karnataka" },
  Mumbai: { lat: 19.0760, lng: 72.8777, defaultState: "Maharashtra" },
  "New Delhi": { lat: 28.6139, lng: 77.2090, defaultState: "Delhi" },
  Kolkata: { lat: 22.5726, lng: 88.3639, defaultState: "West Bengal" },
  Hyderabad: { lat: 17.3850, lng: 78.4867, defaultState: "Telangana" },
  Chennai: { lat: 13.0827, lng: 80.2707, defaultState: "Tamil Nadu" },
  Pune: { lat: 18.5204, lng: 73.8567, defaultState: "Maharashtra" },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, defaultState: "Gujarat" },
  Jaipur: { lat: 26.9124, lng: 75.7873, defaultState: "Rajasthan" },
  Lucknow: { lat: 26.8467, lng: 80.9462, defaultState: "Uttar Pradesh" },
  Chandigarh: { lat: 30.7333, lng: 76.7794, defaultState: "Punjab" },
  Surat: { lat: 21.1702, lng: 72.8311, defaultState: "Gujarat" },
  Kochi: { lat: 9.9312, lng: 76.2673, defaultState: "Kerala" },
  Indore: { lat: 22.7196, lng: 75.8577, defaultState: "Madhya Pradesh" },
  Bhopal: { lat: 23.2599, lng: 77.4126, defaultState: "Madhya Pradesh" },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185, defaultState: "Andhra Pradesh" },
  Vadodara: { lat: 22.3072, lng: 73.1812, defaultState: "Gujarat" },
  Nagpur: { lat: 21.1458, lng: 79.0882, defaultState: "Maharashtra" },
  Patna: { lat: 25.5941, lng: 85.1376, defaultState: "Bihar" },
  Coimbatore: { lat: 11.0168, lng: 76.9558, defaultState: "Tamil Nadu" },
  Madurai: { lat: 9.9252, lng: 78.1198, defaultState: "Tamil Nadu" },
  Mysuru: { lat: 12.2958, lng: 76.6394, defaultState: "Karnataka" },
  Rajkot: { lat: 22.3039, lng: 70.8022, defaultState: "Gujarat" },
  Varanasi: { lat: 25.3176, lng: 82.9739, defaultState: "Uttar Pradesh" },
  Agra: { lat: 27.1767, lng: 78.0081, defaultState: "Uttar Pradesh" },
  Nashik: { lat: 19.9975, lng: 73.7898, defaultState: "Maharashtra" },
  Ranchi: { lat: 23.3441, lng: 85.3096, defaultState: "Jharkhand" },
  Guwahati: { lat: 26.1445, lng: 91.7362, defaultState: "Assam" },
  Noida: { lat: 28.5355, lng: 77.3910, defaultState: "Uttar Pradesh" },
  Faridabad: { lat: 28.4089, lng: 77.3178, defaultState: "Haryana" },
  Thane: { lat: 19.2183, lng: 72.9781, defaultState: "Maharashtra" },
  Kanpur: { lat: 26.4499, lng: 80.3319, defaultState: "Uttar Pradesh" },
  Meerut: { lat: 28.9845, lng: 77.7064, defaultState: "Uttar Pradesh" },
  Kolhapur: { lat: 16.7050, lng: 74.2433, defaultState: "Maharashtra" },
  Solapur: { lat: 17.6599, lng: 75.9064, defaultState: "Maharashtra" },
  Aurangabad: { lat: 19.8762, lng: 75.3433, defaultState: "Maharashtra" },
  Satara: { lat: 17.6805, lng: 74.0183, defaultState: "Maharashtra" },
  Jalna: { lat: 19.8410, lng: 75.8864, defaultState: "Maharashtra" },
  Jammu: { lat: 32.7266, lng: 74.8570, defaultState: "Jammu and Kashmir" },
  Pondicherry: { lat: 11.9416, lng: 79.8083, defaultState: "Puducherry" },
  Goa: { lat: 15.2993, lng: 74.1240, defaultState: "Goa" },
  Chhattisgarh: { lat: 21.2514, lng: 81.6296, defaultState: "Chhattisgarh" },
};

// Curated high-definition fashion photography by clothing type
const CATEGORY_IMAGES: Record<string, string[]> = {
  Dresses: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
  ],
  Tops: [
    "https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
  ],
  Hoodies: [
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
  ],
  "T-shirts": [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
  ],
  Shirts: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
  ],
  Shoes: [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
  ],
  Sweaters: [
    "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80",
  ],
  Pants: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80",
  ],
  Jackets: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80",
  ],
  Jeans: [
    "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80",
  ],
  Skirts: [
    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800&auto=format&fit=crop&q=80",
  ],
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function importDataset() {
  console.log("==========================================================");
  console.log(" POPULATING ZUDIO DIGITAL COMMERCE FROM CSV DATASET");
  console.log("==========================================================\n");

  const csvPath = path.join(process.cwd(), "datasets", "Zudio_sales_data.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Primary dataset not found at ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  console.log(`📄 Loaded ${lines.length - 1} records from Zudio_sales_data.csv.`);

  // 1. Seed Categories (Men, Women, Kids, Footwear)
  console.log("\n📦 Setting up Categories...");
  const categoryDefs = [
    { name: "Men", slug: "men", description: "Contemporary everyday menswear, street casuals & essentials", sortOrder: 1 },
    { name: "Women", slug: "women", description: "Trendy womenswear, ethnic modern, dresses & loungewear", sortOrder: 2 },
    { name: "Kids", slug: "kids", description: "Playful, comfortable & vibrant fashion for kids and teens", sortOrder: 3 },
    { name: "Footwear", slug: "footwear", description: "Sneakers, casual slip-ons, formal shoes & daily comfort footwear", sortOrder: 4 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryDefs) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, description: cat.description, sortOrder: cat.sortOrder },
    });
    categoryMap[cat.slug] = record.id;
  }
  console.log(`✅ Configured 4 Core Categories: Men, Women, Kids, Footwear.`);

  // 2. Seed Sizes
  console.log("\n📐 Setting up Sizes...");
  const sizeDefs = [
    { name: "XS", sortOrder: 1 },
    { name: "S", sortOrder: 2 },
    { name: "M", sortOrder: 3 },
    { name: "L", sortOrder: 4 },
    { name: "XL", sortOrder: 5 },
    { name: "XXL", sortOrder: 6 },
    { name: "28", sortOrder: 7 },
    { name: "30", sortOrder: 8 },
    { name: "32", sortOrder: 9 },
    { name: "34", sortOrder: 10 },
    { name: "UK 7", sortOrder: 11 },
    { name: "UK 8", sortOrder: 12 },
    { name: "UK 9", sortOrder: 13 },
    { name: "UK 10", sortOrder: 14 },
  ];

  const sizeMap: Record<string, string> = {};
  for (const s of sizeDefs) {
    const record = await prisma.size.upsert({
      where: { name: s.name },
      update: { sortOrder: s.sortOrder },
      create: { name: s.name, sortOrder: s.sortOrder },
    });
    sizeMap[s.name] = record.id;
  }
  console.log(`✅ Configured ${sizeDefs.length} standard clothing & footwear sizes.`);

  // 3. Seed Colors
  console.log("\n🎨 Setting up Colors...");
  const colorDefs = [
    { name: "Jet Black", hexCode: "#111111" },
    { name: "Crisp White", hexCode: "#FFFFFF" },
    { name: "Navy Blue", hexCode: "#1B263B" },
    { name: "Olive Green", hexCode: "#4B5320" },
    { name: "Heather Gray", hexCode: "#7D8285" },
    { name: "Rust Amber", hexCode: "#C05621" },
    { name: "Pastel Pink", hexCode: "#F4C2C2" },
  ];

  const colorMap: Record<string, string> = {};
  for (const c of colorDefs) {
    const record = await prisma.color.upsert({
      where: { name: c.name },
      update: { hexCode: c.hexCode },
      create: { name: c.name, hexCode: c.hexCode },
    });
    colorMap[c.name] = record.id;
  }
  console.log(`✅ Configured ${colorDefs.length} fashion color swatches.`);

  // 4. Extract Canonical 100 Stores (Store #1..#100) from Dataset
  console.log("\n🏬 Extracting Canonical Store #1..#100 from Dataset...");
  const canonicalStoreData = new Map<number, any>();
  const rawProducts = new Map<string, { category: string; clothingType: string; prices: number[]; totalQuantitySold: number }>();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 28) continue;

    const state = row[2];
    const city = row[3];
    const category = row[4];
    const clothingType = row[5];
    const storeNumber = parseInt(row[6], 10);
    const postalCode = row[7];
    const address = row[13];
    const contact = row[14];
    const hours = row[15];
    const productId = row[24];
    const price = parseFloat(row[25]) || 999;
    const quantity = parseInt(row[26], 10) || 1;

    if (!isNaN(storeNumber) && storeNumber >= 1 && storeNumber <= 100) {
      if (!canonicalStoreData.has(storeNumber)) {
        const geo = CITY_COORDINATES[city] || { lat: 12.9716, lng: 77.5946, defaultState: state || "Karnataka" };
        canonicalStoreData.set(storeNumber, {
          storeNumber,
          name: `Zudio ${city} (Store #${storeNumber})`,
          slug: `zudio-store-${storeNumber}`,
          city,
          state: geo.defaultState,
          pincode: postalCode && postalCode.length >= 6 ? postalCode.substring(0, 6) : "560038",
          address: `${address || "Commercial Main Road"}, ${city}, ${geo.defaultState}`,
          latitude: geo.lat + (storeNumber % 10) * 0.005,
          longitude: geo.lng + (storeNumber % 10) * 0.005,
          phone: contact || "+91 80 4123 4567",
          openingHours: hours || "10:00 AM - 10:00 PM",
        });
      }
    }

    // Deduplicate product by productId
    if (!rawProducts.has(productId)) {
      rawProducts.set(productId, {
        category,
        clothingType,
        prices: [],
        totalQuantitySold: 0,
      });
    }
    const pEntry = rawProducts.get(productId)!;
    pEntry.prices.push(price);
    pEntry.totalQuantitySold += quantity;
  }

  // 4b. Upsert all 100 Canonical Stores
  const canonicalStores: any[] = [];
  const canonicalStoreMap = new Map<number, any>();

  for (let num = 1; num <= 100; num++) {
    const sData = canonicalStoreData.get(num) || {
      storeNumber: num,
      name: `Zudio Retail Store #${num}`,
      slug: `zudio-store-${num}`,
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      address: `Store #${num} Commercial Area, Bengaluru, Karnataka`,
      latitude: 12.9716 + (num % 10) * 0.005,
      longitude: 77.5946 + (num % 10) * 0.005,
      phone: "+91 80 4123 4567",
      openingHours: "10:00 AM - 10:00 PM",
    };

    const record = await prisma.store.upsert({
      where: { slug: sData.slug },
      update: {
        name: sData.name,
        address: sData.address,
        city: sData.city,
        state: sData.state,
        pincode: sData.pincode,
        latitude: sData.latitude,
        longitude: sData.longitude,
        phone: sData.phone,
        openingHours: sData.openingHours,
        isActive: true,
      },
      create: {
        name: sData.name,
        slug: sData.slug,
        address: sData.address,
        city: sData.city,
        state: sData.state,
        pincode: sData.pincode,
        latitude: sData.latitude,
        longitude: sData.longitude,
        phone: sData.phone,
        openingHours: sData.openingHours,
        isActive: true,
      },
    });

    canonicalStores.push(record);
    canonicalStoreMap.set(num, record);
  }
  console.log(`✅ Upserted exactly ${canonicalStores.length} Canonical Retail Stores (Store #1..#100).`);

  // 4c. Safe Reconcile of any Old Non-Canonical Store Duplicates
  console.log("\n🔄 Checking for legacy duplicate store records to reconcile...");
  const allExistingStores = await prisma.store.findMany({
    select: { id: true, slug: true },
  });

  const canonicalSlugs = new Set(canonicalStores.map((s) => s.slug));
  const legacyStores = allExistingStores.filter((s) => !canonicalSlugs.has(s.slug));

  if (legacyStores.length > 0) {
    console.log(`  Found ${legacyStores.length} legacy duplicate store records to reconcile.`);

    for (const legStore of legacyStores) {
      // Extract store number from slug (e.g. "zudio-jalna-store-30" -> 30)
      const match = legStore.slug.match(/-store-(\d+)$/);
      const storeNum = match ? parseInt(match[1], 10) : 1;
      const targetStore = canonicalStoreMap.get(storeNum) || canonicalStores[0];

      if (targetStore && targetStore.id !== legStore.id) {
        // Re-link inventory
        const legacyInventories = await prisma.inventory.findMany({
          where: { storeId: legStore.id },
        });

        for (const inv of legacyInventories) {
          await prisma.inventory.upsert({
            where: {
              storeId_variantId: {
                storeId: targetStore.id,
                variantId: inv.variantId,
              },
            },
            update: {
              quantity: inv.quantity,
              reservedQuantity: inv.reservedQuantity,
            },
            create: {
              storeId: targetStore.id,
              variantId: inv.variantId,
              quantity: inv.quantity,
              reservedQuantity: inv.reservedQuantity,
            },
          });
        }

        // Remove old inventories pointing to legacy store ID
        await prisma.inventory.deleteMany({
          where: { storeId: legStore.id },
        });

        // Re-link orders if any
        await prisma.order.updateMany({
          where: { storeId: legStore.id },
          data: { storeId: targetStore.id },
        });

        // Re-link reservations if any
        await prisma.reservation.updateMany({
          where: { storeId: legStore.id },
          data: { storeId: targetStore.id },
        });

        // Re-link staff users if any
        await prisma.user.updateMany({
          where: { storeId: legStore.id },
          data: { storeId: targetStore.id },
        });

        // Now safely delete the orphaned legacy store
        await prisma.store.delete({
          where: { id: legStore.id },
        });
      }
    }
    console.log(`✅ Safely reconciled all legacy duplicate stores.`);
  }

  // 5. Parse & Upsert Products and Multi-Variant Catalog
  console.log(`\n👗 Processing ${rawProducts.size} Unique Products from Dataset...`);
  const allVariantRows: { id: string; productId: string; sku: string; sizeId: string; colorId: string; price: number; compareAtPrice: number; isActive: boolean }[] = [];
  const allImageRows: { productId: string; url: string; altText: string; isPrimary: boolean; sortOrder: number }[] = [];

  const productEntries = Array.from(rawProducts.entries());

  for (let idx = 0; idx < productEntries.length; idx++) {
    const [pid, pInfo] = productEntries[idx];
    const avgPrice = Math.round(pInfo.prices.reduce((a, b) => a + b, 0) / pInfo.prices.length);

    let targetCatSlug = pInfo.category.toLowerCase();
    if (pInfo.clothingType === "Shoes") {
      targetCatSlug = "footwear";
    }
    if (!categoryMap[targetCatSlug]) {
      targetCatSlug = "women";
    }
    const categoryId = categoryMap[targetCatSlug];

    const cleanTitle = `${pInfo.category}'s ${pInfo.clothingType === "Shoes" ? "Everyday Comfort Sneakers" : "Essential " + pInfo.clothingType} (Style #${pid})`;
    const slug = `zudio-${targetCatSlug}-${pInfo.clothingType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${pid}`;

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: cleanTitle,
        description: `Premium quality ${pInfo.clothingType.toLowerCase()} from Zudio's ${pInfo.category} everyday collection. Crafted with breathable fabrics, tailored comfort, and modern minimalist styling.`,
        details: "Material: 100% Breathable Combed Cotton / Performance Blend. Machine wash cold with similar colors. Made in India.",
        categoryId,
        isActive: true,
        isFeatured: idx < 12,
        isNewArrival: idx % 4 === 0,
      },
      create: {
        name: cleanTitle,
        slug,
        description: `Premium quality ${pInfo.clothingType.toLowerCase()} from Zudio's ${pInfo.category} everyday collection. Crafted with breathable fabrics, tailored comfort, and modern minimalist styling.`,
        details: "Material: 100% Breathable Combed Cotton / Performance Blend. Machine wash cold with similar colors. Made in India.",
        categoryId,
        isActive: true,
        isFeatured: idx < 12,
        isNewArrival: idx % 4 === 0,
      },
    });

    // Product Images
    const availableImages = CATEGORY_IMAGES[pInfo.clothingType] || CATEGORY_IMAGES["T-shirts"];
    for (let imgIdx = 0; imgIdx < availableImages.length; imgIdx++) {
      allImageRows.push({
        productId: product.id,
        url: availableImages[imgIdx],
        altText: `${product.name} - View ${imgIdx + 1}`,
        isPrimary: imgIdx === 0,
        sortOrder: imgIdx,
      });
    }

    // Sizes
    let relevantSizeNames: string[] = [];
    if (pInfo.clothingType === "Shoes") {
      relevantSizeNames = ["UK 7", "UK 8", "UK 9", "UK 10"];
    } else if (pInfo.clothingType === "Jeans" || pInfo.clothingType === "Pants") {
      relevantSizeNames = ["28", "30", "32", "34"];
    } else {
      relevantSizeNames = ["S", "M", "L", "XL"];
    }

    const selectedColors = [colorDefs[idx % colorDefs.length], colorDefs[(idx + 2) % colorDefs.length]];
    const sampleStores = canonicalStores.slice(0, 19);

    for (const col of selectedColors) {
      const colorId = colorMap[col.name];
      for (const sName of relevantSizeNames) {
        const sizeId = sizeMap[sName];
        if (!colorId || !sizeId) continue;

        const colCode = col.name.replace(/\s+/g, "").substring(0, 3).toUpperCase();
        const sizeCode = sName.replace(/\s+/g, "").toUpperCase();
        const sku = `ZUD-${pid}-${colCode}-${sizeCode}`;
        const variantId = `var_${pid}_${colCode}_${sizeCode}`;

        allVariantRows.push({
          id: variantId,
          productId: product.id,
          sku,
          sizeId,
          colorId,
          price: avgPrice,
          compareAtPrice: Math.round(avgPrice * 1.3),
          isActive: true,
        });
      }
    }

    if ((idx + 1) % 100 === 0 || idx === productEntries.length - 1) {
      console.log(`  Processed ${idx + 1}/${productEntries.length} products... (${allVariantRows.length} variants staged)`);
    }
  }

  console.log(`\n🖼️ Bulk-inserting ${allImageRows.length} Product Images...`);
  await prisma.productImage.deleteMany({});
  const IMAGE_CHUNK_SIZE = 1000;
  for (let c = 0; c < allImageRows.length; c += IMAGE_CHUNK_SIZE) {
    const chunk = allImageRows.slice(c, c + IMAGE_CHUNK_SIZE);
    await prisma.productImage.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`\n🏷️ Bulk-inserting ${allVariantRows.length} Product Variants...`);
  const VARIANT_CHUNK_SIZE = 1000;
  for (let c = 0; c < allVariantRows.length; c += VARIANT_CHUNK_SIZE) {
    const chunk = allVariantRows.slice(c, c + VARIANT_CHUNK_SIZE);
    await prisma.productVariant.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
  const totalVariantsCreated = allVariantRows.length;

  console.log("\n🔄 Resolving canonical Variant IDs for Inventory mapping...");
  const dbVariants = await prisma.productVariant.findMany({ select: { id: true, sku: true } });
  const skuToId = new Map<string, string>(dbVariants.map((v) => [v.sku, v.id]));

  const sampleStores = canonicalStores.slice(0, 19);
  const allInventoryRows: { storeId: string; variantId: string; quantity: number; reservedQuantity: number }[] = [];

  for (let vIdx = 0; vIdx < allVariantRows.length; vIdx++) {
    const v = allVariantRows[vIdx];
    const realVariantId = skuToId.get(v.sku);
    if (!realVariantId) continue;

    for (let sIdx = 0; sIdx < sampleStores.length; sIdx++) {
      const store = sampleStores[sIdx];
      const seedNum = (sIdx + vIdx * 3) % 9;
      const qty = seedNum + 4;
      const reserved = qty > 6 ? 1 : 0;
      allInventoryRows.push({
        storeId: store.id,
        variantId: realVariantId,
        quantity: qty,
        reservedQuantity: reserved,
      });
    }
  }

  console.log(`\n📦 Bulk-inserting ${allInventoryRows.length} Inventory Records across stocked stores...`);
  const INVENTORY_CHUNK_SIZE = 2000;
  for (let c = 0; c < allInventoryRows.length; c += INVENTORY_CHUNK_SIZE) {
    const chunk = allInventoryRows.slice(c, c + INVENTORY_CHUNK_SIZE);
    await prisma.inventory.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    if ((c + chunk.length) % 20000 === 0 || c + chunk.length === allInventoryRows.length) {
      console.log(`  Inserted ${c + chunk.length}/${allInventoryRows.length} inventory records...`);
    }
  }
  const totalInventoryCreated = allInventoryRows.length;

  // 6. Seed Exactly 3 Demo User Roles (Unconditionally)
  console.log("\n👤 Seeding Exactly 3 Demo User Accounts...");
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin@12345";
  const staffPassword = process.env.DEMO_STAFF_PASSWORD || "Staff@12345";
  const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD || "Customer@12345";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const staffHash = await bcrypt.hash(staffPassword, 10);
  const customerHash = await bcrypt.hash(customerPassword, 10);

  const blrStore = canonicalStores.find((s) => s.city === "Bengaluru") || canonicalStores[0];

  await prisma.user.upsert({
    where: { email: "admin@zudio.demo" },
    update: { passwordHash: adminHash, role: "ADMIN" },
    create: {
      name: "Demo Administrator",
      email: "admin@zudio.demo",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "staff.blr@zudio.demo" },
    update: { passwordHash: staffHash, role: "STORE_STAFF", storeId: blrStore.id },
    create: {
      name: "Bengaluru Store Staff",
      email: "staff.blr@zudio.demo",
      passwordHash: staffHash,
      role: "STORE_STAFF",
      storeId: blrStore.id,
    },
  });

  const demoCust = await prisma.user.upsert({
    where: { email: "customer@zudio.demo" },
    update: { passwordHash: customerHash, role: "CUSTOMER" },
    create: {
      name: "Demo Customer",
      email: "customer@zudio.demo",
      passwordHash: customerHash,
      role: "CUSTOMER",
    },
  });

  await prisma.cart.upsert({
    where: { userId: demoCust.id },
    update: {},
    create: { userId: demoCust.id },
  });

  await prisma.wishlist.upsert({
    where: { userId: demoCust.id },
    update: {},
    create: { userId: demoCust.id },
  });

  console.log("✅ Successfully seeded 3 demo user roles (ADMIN, STORE_STAFF, CUSTOMER).");

  console.log("\n==========================================================");
  console.log(" RECONCILIATION & DATASET IMPORT COMPLETE! 🎉");
  console.log(` • Categories: 4`);
  console.log(` • Canonical Retail Stores: ${canonicalStores.length}`);
  console.log(` • Products: ${rawProducts.size}`);
  console.log(` • Product Variants: ${totalVariantsCreated}`);
  console.log(` • Store Inventory Records: ${totalInventoryCreated}`);
  console.log(` • Demo Users: 3`);
  console.log("==========================================================\n");
}

// Auto-execute when run as a standalone script
if (require.main === module) {
  importDataset()
    .catch((e) => {
      console.error("❌ Dataset import error:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
