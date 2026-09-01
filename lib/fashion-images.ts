/**
 * Curated High-Definition Fashion Imagery Registry
 * Provides diverse, high-editorial fashion photography matching exact categories and clothing types
 * with primary and secondary (hover) views.
 */

export interface ImagePair {
  primary: string;
  secondary: string;
}

export const FASHION_IMAGE_REGISTRY: Record<string, ImagePair[]> = {
  // --- MEN'S APPAREL ---
  "Men:T-shirts": [
    {
      primary: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Men:Shirts": [
    {
      primary: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1620012253295-c15c429fcc70?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Men:Hoodies": [
    {
      primary: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Men:Jackets": [
    {
      primary: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Men:Jeans": [
    {
      primary: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Men:Pants": [
    {
      primary: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Men:Sweaters": [
    {
      primary: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Men:Shoes": [
    {
      primary: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
    },
  ],

  // --- WOMEN'S APPAREL ---
  "Women:Dresses": [
    {
      primary: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Tops": [
    {
      primary: "https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:T-shirts": [
    {
      primary: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Shirts": [
    {
      primary: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Hoodies": [
    {
      primary: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Sweaters": [
    {
      primary: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Pants": [
    {
      primary: "https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Jackets": [
    {
      primary: "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Jeans": [
    {
      primary: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Skirts": [
    {
      primary: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800&auto=format&fit=crop&q=80",
    },
  ],
  "Women:Shoes": [
    {
      primary: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
    },
  ],

  // --- KIDS ---
  "Kids:General": [
    {
      primary: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
    },
  ],

  // --- FOOTWEAR ---
  "Footwear:General": [
    {
      primary: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
    },
    {
      primary: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
      secondary: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80",
    },
  ],
};

/**
 * Deterministically picks a diverse curated image pair based on category, clothing type, and product ID.
 */
export function getCuratedFashionImages(
  categoryName?: string,
  clothingType?: string,
  productIdOrSlug?: string
): ImagePair {
  const cat = categoryName || "Men";
  const type = clothingType || "T-shirts";

  let key = `${cat}:${type}`;
  let pool = FASHION_IMAGE_REGISTRY[key];

  if (!pool || pool.length === 0) {
    if (cat.toLowerCase() === "kids") {
      pool = FASHION_IMAGE_REGISTRY["Kids:General"];
    } else if (cat.toLowerCase() === "footwear" || type.toLowerCase() === "shoes") {
      pool = FASHION_IMAGE_REGISTRY["Footwear:General"];
    } else if (FASHION_IMAGE_REGISTRY[`${cat}:T-shirts`]) {
      pool = FASHION_IMAGE_REGISTRY[`${cat}:T-shirts`];
    } else {
      pool = FASHION_IMAGE_REGISTRY["Men:T-shirts"];
    }
  }

  // Generate deterministic index based on product ID/slug
  let hash = 0;
  const str = productIdOrSlug || "default";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % pool.length;

  return pool[idx] || pool[0];
}
