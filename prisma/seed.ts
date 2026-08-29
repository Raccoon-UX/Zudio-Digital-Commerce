import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed for Zudio Digital Commerce (Concept Pilot)...");

  // 1. Clean existing records in reverse dependency order
  await prisma.reservation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderAddress.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.size.deleteMany();
  await prisma.color.deleteMany();
  await prisma.store.deleteMany();

  console.log("🧹 Cleaned existing database records.");

  // 2. Seed Sizes
  const sizeData = [
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
  for (const s of sizeData) {
    const created = await prisma.size.create({ data: s });
    sizeMap[created.name] = created.id;
  }
  console.log(`✅ Created ${sizeData.length} sizes.`);

  // 3. Seed Colors
  const colorData = [
    { name: "Jet Black", hexCode: "#111111" },
    { name: "Crisp White", hexCode: "#FFFFFF" },
    { name: "Olive Green", hexCode: "#4B5320" },
    { name: "Navy Blue", hexCode: "#1B263B" },
    { name: "Heather Gray", hexCode: "#7D8285" },
    { name: "Rust Amber", hexCode: "#C05621" },
    { name: "Pastel Pink", hexCode: "#F4C2C2" },
    { name: "Sand Beige", hexCode: "#D2B48C" },
  ];

  const colorMap: Record<string, string> = {};
  for (const c of colorData) {
    const created = await prisma.color.create({ data: c });
    colorMap[created.name] = created.id;
  }
  console.log(`✅ Created ${colorData.length} colors.`);

  // 4. Seed Categories (Hierarchical)
  const menCat = await prisma.category.create({
    data: {
      name: "Men",
      slug: "men",
      description: "Contemporary everyday menswear, tees, shirts, and bottom wear.",
      sortOrder: 1,
    },
  });

  const womenCat = await prisma.category.create({
    data: {
      name: "Women",
      slug: "women",
      description: "Trending dresses, tops, ethnic wear, and daily casuals.",
      sortOrder: 2,
    },
  });

  const kidsCat = await prisma.category.create({
    data: {
      name: "Kids",
      slug: "kids",
      description: "Playful, comfortable clothing sets for boys and girls.",
      sortOrder: 3,
    },
  });

  const footwearCat = await prisma.category.create({
    data: {
      name: "Footwear",
      slug: "footwear",
      description: "Everyday sneakers, sliders, loafers, and daily footwear.",
      sortOrder: 4,
    },
  });

  // Subcategories
  const menTees = await prisma.category.create({
    data: { name: "T-Shirts & Polos", slug: "men-tshirts", parentId: menCat.id, sortOrder: 1 },
  });
  const menShirts = await prisma.category.create({
    data: { name: "Casual & Formal Shirts", slug: "men-shirts", parentId: menCat.id, sortOrder: 2 },
  });
  const menJeans = await prisma.category.create({
    data: { name: "Jeans & Trousers", slug: "men-jeans", parentId: menCat.id, sortOrder: 3 },
  });

  const womenDresses = await prisma.category.create({
    data: { name: "Dresses & Jumpsuits", slug: "women-dresses", parentId: womenCat.id, sortOrder: 1 },
  });
  const womenTops = await prisma.category.create({
    data: { name: "Tops & Tees", slug: "women-tops", parentId: womenCat.id, sortOrder: 2 },
  });
  const womenEthnic = await prisma.category.create({
    data: { name: "Kurtas & Ethnic", slug: "women-ethnic", parentId: womenCat.id, sortOrder: 3 },
  });

  console.log("✅ Created top-level & sub-categories.");

  // 5. Seed Stores (Physical demo stores across Indian metros)
  const storesData = [
    {
      name: "Zudio Indiranagar Flagship",
      slug: "zudio-indiranagar-bengaluru",
      address: "100 Feet Road, HAL 2nd Stage, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      latitude: 12.9716,
      longitude: 77.6412,
      phone: "+91 80 4123 4567",
      openingHours: "10:00 AM - 10:00 PM",
    },
    {
      name: "Zudio Bandra West",
      slug: "zudio-bandra-west-mumbai",
      address: "Linking Road, Near National College, Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      latitude: 19.0596,
      longitude: 72.8295,
      phone: "+91 22 2640 1234",
      openingHours: "10:30 AM - 10:00 PM",
    },
    {
      name: "Zudio South Extension",
      slug: "zudio-south-extension-delhi",
      address: "South Extension Part 1, Ring Road",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110049",
      latitude: 28.5678,
      longitude: 77.2215,
      phone: "+91 11 4155 8900",
      openingHours: "10:00 AM - 09:30 PM",
    },
    {
      name: "Zudio Koregaon Park",
      slug: "zudio-koregaon-park-pune",
      address: "North Main Road, Near Lane 6, Koregaon Park",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      latitude: 18.5362,
      longitude: 73.8938,
      phone: "+91 20 6601 4455",
      openingHours: "10:00 AM - 10:00 PM",
    },
    {
      name: "Zudio Banjara Hills",
      slug: "zudio-banjara-hills-hyderabad",
      address: "Road No. 2, Banjara Hills",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500034",
      latitude: 17.4165,
      longitude: 78.4382,
      phone: "+91 40 2335 7788",
      openingHours: "10:00 AM - 10:00 PM",
    },
    {
      name: "Zudio Anna Nagar",
      slug: "zudio-anna-nagar-chennai",
      address: "2nd Avenue, Anna Nagar East",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600102",
      latitude: 13.0850,
      longitude: 80.2101,
      phone: "+91 44 2621 3344",
      openingHours: "10:00 AM - 09:30 PM",
    },
  ];

  const storeRecords = [];
  for (const s of storesData) {
    const created = await prisma.store.create({ data: s });
    storeRecords.push(created);
  }
  console.log(`✅ Created ${storeRecords.length} physical stores.`);

  // 6. Seed Products, Variants, Images & Store Inventory
  const productsData = [
    {
      name: "Heavyweight Oversized Boxy Tee",
      slug: "heavyweight-oversized-boxy-tee",
      description: "Crafted from 240 GSM combed cotton with a relaxed drop-shoulder silhouette and ribbed crew collar. Designed for everyday streetwear comfort.",
      details: "100% Cotton. Machine wash cold. Do not tumble dry. Made in India.",
      categoryId: menTees.id,
      isFeatured: true,
      isNewArrival: true,
      price: 499.00,
      compareAtPrice: 699.00,
      colors: ["Jet Black", "Crisp White", "Olive Green"],
      sizes: ["S", "M", "L", "XL"],
      images: [
        { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Heavyweight Oversized Tee Front" },
        { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Heavyweight Oversized Tee Back" },
      ],
    },
    {
      name: "Classic Resort Collar Linen-Blend Shirt",
      slug: "classic-resort-collar-linen-blend-shirt",
      description: "Breathable linen-cotton blend shirt featuring a relaxed camp collar, short sleeves, and front button placket. Perfect for warm-weather casual outings.",
      details: "55% Linen, 45% Cotton. Gentle machine wash. Iron on reverse.",
      categoryId: menShirts.id,
      isFeatured: true,
      isNewArrival: false,
      price: 699.00,
      compareAtPrice: 899.00,
      colors: ["Crisp White", "Sand Beige", "Navy Blue"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      images: [
        { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Resort Collar Shirt Front" },
        { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Resort Collar Shirt Detail" },
      ],
    },
    {
      name: "Straight-Fit Vintage Wash Denim Jeans",
      slug: "straight-fit-vintage-wash-denim-jeans",
      description: "Mid-rise straight fit jeans in durable cotton denim with authentic vintage wash fading. Classic 5-pocket styling with zip fly and branded button.",
      details: "99% Cotton, 1% Elastane. Wash inside out. Dry in shade.",
      categoryId: menJeans.id,
      isFeatured: false,
      isNewArrival: true,
      price: 899.00,
      compareAtPrice: 1199.00,
      colors: ["Navy Blue", "Jet Black"],
      sizes: ["28", "30", "32", "34"],
      images: [
        { url: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Straight-Fit Jeans Front" },
        { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Straight-Fit Jeans Folded" },
      ],
    },
    {
      name: "Floral Print Tiered Midi Dress",
      slug: "floral-print-tiered-midi-dress",
      description: "Airy woven rayon midi dress with subtle sweetheart neckline, short puff sleeves, and tiered flounce hemline. Features a delicate botanical floral motif.",
      details: "100% Viscose Rayon. Dry clean or hand wash cold.",
      categoryId: womenDresses.id,
      isFeatured: true,
      isNewArrival: true,
      price: 799.00,
      compareAtPrice: 1099.00,
      colors: ["Pastel Pink", "Navy Blue", "Crisp White"],
      sizes: ["XS", "S", "M", "L", "XL"],
      images: [
        { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Floral Tiered Midi Dress" },
        { url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Floral Dress Lifestyle" },
      ],
    },
    {
      name: "Ribbed Knit Crew-Neck Crop Top",
      slug: "ribbed-knit-crew-neck-crop-top",
      description: "Fitted short-sleeve crop top in stretchy fine-ribbed cotton jersey. Clean finished hems with high-density stretch recovery.",
      details: "95% Cotton, 5% Spandex. Machine wash cold.",
      categoryId: womenTops.id,
      isFeatured: false,
      isNewArrival: false,
      price: 299.00,
      compareAtPrice: 399.00,
      colors: ["Crisp White", "Jet Black", "Rust Amber", "Heather Gray"],
      sizes: ["XS", "S", "M", "L"],
      images: [
        { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Ribbed Crop Top Front" },
        { url: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Ribbed Crop Top Studio" },
      ],
    },
    {
      name: "Hand-Block Printed Straight Cotton Kurta",
      slug: "hand-block-printed-straight-cotton-kurta",
      description: "Traditional straight-cut kurta crafted in pure breathable cotton with artisanal hand-block geometric prints and keyhole neck.",
      details: "100% Pure Cotton. Gentle hand wash separately.",
      categoryId: womenEthnic.id,
      isFeatured: true,
      isNewArrival: true,
      price: 699.00,
      compareAtPrice: 899.00,
      colors: ["Rust Amber", "Navy Blue", "Olive Green"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      images: [
        { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Cotton Kurta Front" },
        { url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Cotton Kurta Detail" },
      ],
    },
    {
      name: "Everyday Minimalist Low-Top Sneakers",
      slug: "everyday-minimalist-low-top-sneakers",
      description: "Clean aesthetic low-top vulcanized sneakers with synthetic leather upper, padded collar, and high-traction rubber outsole.",
      details: "Synthetic Upper, EVA Cushioning Insole, Rubber Outsole. Wipe clean with damp cloth.",
      categoryId: footwearCat.id,
      isFeatured: true,
      isNewArrival: false,
      price: 899.00,
      compareAtPrice: 1299.00,
      colors: ["Crisp White", "Jet Black"],
      sizes: ["UK 7", "UK 8", "UK 9", "UK 10"],
      images: [
        { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Minimalist White Sneakers Side" },
        { url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Minimalist White Sneakers Pair" },
      ],
    },
    {
      name: "Kids Graphic Print Cotton Play Set",
      slug: "kids-graphic-print-cotton-play-set",
      description: "2-piece coordinated outfit comprising a breathable graphic cotton tee and elasticated drawstring shorts for active kids.",
      details: "100% Bio-Washed Cotton. Machine wash gentle.",
      categoryId: kidsCat.id,
      isFeatured: false,
      isNewArrival: true,
      price: 399.00,
      compareAtPrice: 599.00,
      colors: ["Navy Blue", "Olive Green", "Pastel Pink"],
      sizes: ["S", "M", "L"],
      images: [
        { url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80", isPrimary: true, altText: "Kids Graphic Play Set" },
        { url: "https://images.unsplash.com/photo-1503944543280-759d4c2b9952?w=800&auto=format&fit=crop&q=80", isPrimary: false, altText: "Kids Casual Set" },
      ],
    },
  ];

  let totalVariants = 0;
  let totalInventoryRecords = 0;

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        details: p.details,
        categoryId: p.categoryId,
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
      },
    });

    // Create Images
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i];
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          sortOrder: i,
        },
      });
    }

    // Create Variants (Cartesian product of colors x sizes)
    for (const colorName of p.colors) {
      const colorId = colorMap[colorName];
      for (const sizeName of p.sizes) {
        const sizeId = sizeMap[sizeName];
        if (!colorId || !sizeId) continue;

        const colorCode = colorName.replace(/\s+/g, "").substring(0, 3).toUpperCase();
        const sizeCode = sizeName.replace(/\s+/g, "").toUpperCase();
        const sku = `ZUD-${product.slug.substring(0, 8).toUpperCase()}-${colorCode}-${sizeCode}`;

        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            sizeId,
            colorId,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            isActive: true,
          },
        });
        totalVariants++;

        // Distribute Demo Store Inventory across 6 stores
        // We vary quantities so some stores have high stock, some low, some out-of-stock
        for (let sIdx = 0; sIdx < storeRecords.length; sIdx++) {
          const store = storeRecords[sIdx];
          // Deterministic pseudorandom quantity
          const seedNum = (sIdx + totalVariants * 7) % 11;
          let qty = 0;
          if (seedNum > 8) qty = 0; // out of stock
          else if (seedNum > 5) qty = 2; // low stock
          else qty = seedNum + 3; // in stock (3-8)

          const reserved = qty > 2 ? 1 : 0;

          await prisma.inventory.create({
            data: {
              storeId: store.id,
              variantId: variant.id,
              quantity: qty,
              reservedQuantity: reserved,
            },
          });
          totalInventoryRecords++;
        }
      }
    }
  }

  console.log(`✅ Created ${productsData.length} products, ${totalVariants} variants, and ${totalInventoryRecords} store inventory records.`);

  // 6. Seed Demo Accounts ONLY if explicitly enabled in non-production
  const isProduction = process.env.NODE_ENV === "production";
  const demoSeedEnabled = process.env.DEMO_SEED_ENABLED === "true";

  if (demoSeedEnabled && !isProduction) {
    console.log("👤 Seeding demo accounts for Concept Pilot testing...");
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin@12345";
    const staffPassword = process.env.DEMO_STAFF_PASSWORD || "Staff@12345";
    const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD || "Customer@12345";

    const adminHash = await bcrypt.hash(adminPassword, 10);
    const staffHash = await bcrypt.hash(staffPassword, 10);
    const customerHash = await bcrypt.hash(customerPassword, 10);

    const blrStore = storeRecords.find((s) => s.slug === "zudio-indiranagar-bengaluru") || storeRecords[0];

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

    console.log("✅ Seeded 3 demo user roles (ADMIN, STORE_STAFF, CUSTOMER).");
  } else if (isProduction) {
    console.log("🔒 Production environment detected: Skipping demo accounts generation.");
  } else {
    console.log("ℹ️ DEMO_SEED_ENABLED is not 'true': Skipping demo accounts generation.");
  }

  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
