export const APP_CONFIG = {
  name: "Zudio Concept Pilot",
  tagline: "Fashion for Everyday — Online Discovery & In-Store Availability",
  description: "Digital commerce and physical store integration prototype for everyday fashion.",
  disclaimer: "Unofficial concept prototype for demonstration purposes only. Not affiliated with or endorsed by Trent Ltd / Zudio.",
  currency: "INR",
  currencySymbol: "₹",
  deliveryFee: 49,
  freeDeliveryThreshold: 799,
};

export const NAVIGATION_LINKS = [
  { name: "Men", href: "/categories/men" },
  { name: "Women", href: "/categories/women" },
  { name: "Kids", href: "/categories/kids" },
  { name: "Footwear", href: "/categories/footwear" },
  { name: "Stores", href: "/stores" },
];

export const FOOTER_LINKS = {
  shop: [
    { name: "Men's Collection", href: "/categories/men" },
    { name: "Women's Collection", href: "/categories/women" },
    { name: "Kids' Collection", href: "/categories/kids" },
    { name: "Footwear & Accessories", href: "/categories/footwear" },
    { name: "New Arrivals", href: "/products?filter=new" },
  ],
  services: [
    { name: "Find a Store", href: "/stores" },
    { name: "Check Store Stock", href: "/products" },
    { name: "Store Reservations", href: "/profile" },
    { name: "Track Orders", href: "/orders" },
  ],
  account: [
    { name: "My Account", href: "/profile" },
    { name: "Wishlist", href: "/wishlist" },
    { name: "Cart", href: "/cart" },
    { name: "Order History", href: "/orders" },
    { name: "Admin Portal", href: "/admin" },
  ],
};
