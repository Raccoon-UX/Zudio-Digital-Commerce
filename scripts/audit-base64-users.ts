import { prisma } from "../lib/prisma/client";

async function auditBase64Users() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, image: true, googleImage: true },
  });
  console.log("TOTAL_USERS:", users.length);
  const base64Users = users.filter((u) => u.image && u.image.startsWith("data:image"));
  console.log("USERS_WITH_BASE64_IMAGE:", base64Users.length);
  for (const u of users) {
    console.log(`- ${u.email}: image=${u.image ? (u.image.length > 40 ? u.image.substring(0, 30) + "..." : u.image) : "null"}, googleImage=${u.googleImage || "null"}`);
  }
}

auditBase64Users().finally(() => prisma.$disconnect());
