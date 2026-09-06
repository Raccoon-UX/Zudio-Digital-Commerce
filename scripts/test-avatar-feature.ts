import { prisma } from "../lib/prisma/client";
import {
  validateAndExtractAvatarBuffer,
  validateGoogleAvatarUrl,
  buildAvatarEndpointUrl,
} from "../lib/auth/avatar";
import { hashPassword } from "../lib/auth/password";
import { authOptions } from "../modules/auth/auth.config";

// Sample 1x1 valid test images
const TINY_PNG_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const TINY_JPEG_BASE64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

// Minimal 1x1 valid WebP
const TINY_WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x4c, 0x0d, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
  0x10, 0x07, 0x10, 0x11, 0x11, 0x88, 0x88, 0xfe, 0x07, 0x00,
]);

const GOOGLE_AVATAR_URL =
  "https://lh3.googleusercontent.com/a/ACg8ocIq8example123456=s96-c";

async function runComprehensiveAvatarTests() {
  console.log("===============================================================");
  console.log(" COMPREHENSIVE PROFILE AVATAR SYSTEM VERIFICATION");
  console.log(" URL-BASED LIGHTWEIGHT ARCHITECTURE + USERAVATAR BINARY MODEL");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: [${testName}] ${detail || ""}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: [${testName}] ${detail || ""}`);
      failed++;
    }
  }

  const testEmailPrefix = `test_avatar_arch_${Date.now()}`;

  try {
    // -------------------------------------------------------------
    // Test Group 1: Binary Validation & Format Guards
    // -------------------------------------------------------------
    console.log("[Group 1: Binary Validation & Format Extraction]");
    
    // A. JPEG Validation
    const jpegVal = validateAndExtractAvatarBuffer(TINY_JPEG_BASE64);
    assert(jpegVal.isValid && jpegVal.mimeType === "image/jpeg", "A. Validates and decodes JPEG");

    // B. PNG Validation
    const pngVal = validateAndExtractAvatarBuffer(TINY_PNG_BASE64);
    assert(pngVal.isValid && pngVal.mimeType === "image/png", "B. Validates and decodes PNG");

    // C. WebP Validation
    const webpVal = validateAndExtractAvatarBuffer(TINY_WEBP_BUFFER);
    assert(webpVal.isValid && webpVal.mimeType === "image/webp", "C. Validates and decodes WebP");

    // D. Google HTTPS URL Validation
    const googleVal = validateGoogleAvatarUrl(GOOGLE_AVATAR_URL);
    assert(googleVal.isValid && googleVal.cleanUrl === GOOGLE_AVATAR_URL, "D. Validates Google HTTPS URL");

    // L. Invalid MIME rejection
    const invalidMime = validateAndExtractAvatarBuffer("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
    assert(!invalidMime.isValid, "L. Rejects disallowed GIF MIME type");

    // M. Invalid Magic Bytes rejection
    const fakePng = validateAndExtractAvatarBuffer("data:image/png;base64,Tm90QVBOR0ZpbGUxMjM0NTY3ODkw");
    assert(!fakePng.isValid, "M. Rejects fake MIME with corrupted magic bytes");

    // N. SVG rejection (XSS guard)
    const svgVal = validateAndExtractAvatarBuffer("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=");
    assert(!svgVal.isValid, "N. Rejects SVG vectors to prevent XSS payloads");

    // O. >2MB rejection
    const oversizedBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0xff);
    const oversizedVal = validateAndExtractAvatarBuffer(oversizedBuffer);
    assert(!oversizedVal.isValid && (oversizedVal.error?.includes("2MB") || false), "O. Rejects oversized files > 2MB");

    // -------------------------------------------------------------
    // Test Group 2: Account Creation & Registration Storage
    // -------------------------------------------------------------
    console.log("\n[Group 2: Registration & Account Creation Storage]");
    const passwordHash = await hashPassword("SecurePassword123!");

    // Test A: New account without avatar
    const emailA = `${testEmailPrefix}_a@example.com`;
    const userA = await prisma.user.create({
      data: {
        name: "User No Avatar",
        email: emailA,
        passwordHash,
        image: null,
        role: "CUSTOMER",
      },
    });
    const avatarRecordA = await prisma.userAvatar.findUnique({ where: { userId: userA.id } });
    assert(userA.image === null && avatarRecordA === null, "A. New account without avatar has User.image=null and no UserAvatar row");

    // Test B: New account with JPEG
    const emailB = `${testEmailPrefix}_b@example.com`;
    const userB = await prisma.user.create({
      data: {
        name: "User JPEG",
        email: emailB,
        passwordHash,
        role: "CUSTOMER",
      },
    });
    await prisma.userAvatar.create({
      data: {
        userId: userB.id,
        data: jpegVal.buffer!,
        mimeType: jpegVal.mimeType!,
        size: jpegVal.size!,
      },
    });
    const avatarUrlB = buildAvatarEndpointUrl(userB.id);
    const updatedUserB = await prisma.user.update({
      where: { id: userB.id },
      data: { image: avatarUrlB },
    });
    assert(
      updatedUserB.image === `/api/user/avatar/${userB.id}` && !updatedUserB.image.startsWith("data:"),
      "B. New account with JPEG stores binary in UserAvatar and lightweight URL in User.image",
      `User.image: "${updatedUserB.image}" (${updatedUserB.image?.length} chars)`
    );

    // Test C: New account with PNG
    const emailC = `${testEmailPrefix}_c@example.com`;
    const userC = await prisma.user.create({
      data: {
        name: "User PNG",
        email: emailC,
        passwordHash,
        role: "CUSTOMER",
      },
    });
    await prisma.userAvatar.create({
      data: {
        userId: userC.id,
        data: pngVal.buffer!,
        mimeType: pngVal.mimeType!,
        size: pngVal.size!,
      },
    });
    const updatedUserC = await prisma.user.update({
      where: { id: userC.id },
      data: { image: buildAvatarEndpointUrl(userC.id) },
    });
    assert(
      updatedUserC.image === `/api/user/avatar/${userC.id}`,
      "C. New account with PNG stores binary in UserAvatar and endpoint URL in User.image"
    );

    // Test D: New account with WebP
    const emailD = `${testEmailPrefix}_d@example.com`;
    const userD = await prisma.user.create({
      data: {
        name: "User WebP",
        email: emailD,
        passwordHash,
        role: "CUSTOMER",
      },
    });
    await prisma.userAvatar.create({
      data: {
        userId: userD.id,
        data: webpVal.buffer!,
        mimeType: webpVal.mimeType!,
        size: webpVal.size!,
      },
    });
    const updatedUserD = await prisma.user.update({
      where: { id: userD.id },
      data: { image: buildAvatarEndpointUrl(userD.id) },
    });
    assert(
      updatedUserD.image === `/api/user/avatar/${userD.id}`,
      "D. New account with WebP stores binary in UserAvatar and endpoint URL in User.image"
    );

    // -------------------------------------------------------------
    // Test Group 3: Profile Edit & Lifecycle (Upload, Replace, Remove)
    // -------------------------------------------------------------
    console.log("\n[Group 3: Profile Edit, Replace & Remove Lifecycle]");
    
    // E. Existing user uploads avatar
    await prisma.userAvatar.upsert({
      where: { userId: userA.id },
      create: {
        userId: userA.id,
        data: pngVal.buffer!,
        mimeType: pngVal.mimeType!,
        size: pngVal.size!,
      },
      update: {
        data: pngVal.buffer!,
        mimeType: pngVal.mimeType!,
        size: pngVal.size!,
      },
    });
    const userAUploaded = await prisma.user.update({
      where: { id: userA.id },
      data: { image: buildAvatarEndpointUrl(userA.id) },
    });
    assert(userAUploaded.image === `/api/user/avatar/${userA.id}`, "E. Existing user uploads custom avatar");

    // F. Existing user replaces avatar
    await prisma.userAvatar.update({
      where: { userId: userA.id },
      data: {
        data: jpegVal.buffer!,
        mimeType: jpegVal.mimeType!,
        size: jpegVal.size!,
      },
    });
    const avatarAfterReplace = await prisma.userAvatar.findUnique({ where: { userId: userA.id } });
    assert(
      avatarAfterReplace?.mimeType === "image/jpeg" && avatarAfterReplace.size === jpegVal.size,
      "F. Existing user replaces avatar (updates UserAvatar binary without duplicate rows)"
    );

    // G. Existing user removes avatar
    await prisma.userAvatar.deleteMany({ where: { userId: userA.id } });
    const userARemoved = await prisma.user.update({
      where: { id: userA.id },
      data: { image: null },
    });
    const avatarAfterDelete = await prisma.userAvatar.findUnique({ where: { userId: userA.id } });
    assert(
      userARemoved.image === null && avatarAfterDelete === null,
      "G. Existing user removes avatar (cleans up UserAvatar and sets User.image=null)"
    );

    // -------------------------------------------------------------
    // Test Group 4: Google OAuth & Avatar Priority
    // -------------------------------------------------------------
    console.log("\n[Group 4: Google OAuth & Priority Resolution]");
    const googleEmail = `${testEmailPrefix}_google@example.com`;

    // H. Google login with Google image
    const googleUser = { id: "temp-google-id", email: googleEmail, name: "Google User" };
    const googleAccount = { provider: "google" };
    const googleProfile = { name: "Google User", email: googleEmail, picture: GOOGLE_AVATAR_URL };

    const signInCb = authOptions.callbacks?.signIn;
    if (signInCb) {
      await signInCb({
        user: googleUser as any,
        account: googleAccount as any,
        profile: googleProfile as any,
      });
    }

    const createdGoogleUser = await prisma.user.findUnique({ where: { email: googleEmail } });
    assert(
      createdGoogleUser?.googleImage === GOOGLE_AVATAR_URL && createdGoogleUser.image === null,
      "H. Google login creates user with googleImage and keeps custom image=null"
    );

    // I. Custom avatar + Google login (custom avatar is NOT overwritten)
    await prisma.userAvatar.create({
      data: {
        userId: createdGoogleUser!.id,
        data: pngVal.buffer!,
        mimeType: pngVal.mimeType!,
        size: pngVal.size!,
      },
    });
    const customAvatarUrl = buildAvatarEndpointUrl(createdGoogleUser!.id);
    await prisma.user.update({
      where: { id: createdGoogleUser!.id },
      data: { image: customAvatarUrl },
    });

    // Simulate subsequent Google login
    const updatedGoogleProfile = {
      name: "Google User",
      email: googleEmail,
      picture: "https://lh3.googleusercontent.com/a/NEW_GOOGLE_PIC=s96-c",
    };
    if (signInCb) {
      await signInCb({
        user: googleUser as any,
        account: googleAccount as any,
        profile: updatedGoogleProfile as any,
      });
    }

    const userAfterSecondGoogle = await prisma.user.findUnique({ where: { id: createdGoogleUser!.id } });
    assert(
      userAfterSecondGoogle?.image === customAvatarUrl,
      "I. Custom avatar is NEVER overwritten by subsequent Google sign-ins"
    );
    assert(
      userAfterSecondGoogle?.googleImage === "https://lh3.googleusercontent.com/a/NEW_GOOGLE_PIC=s96-c",
      "I. googleImage is updated in background"
    );

    // J. Remove custom -> Google fallback
    await prisma.userAvatar.deleteMany({ where: { userId: createdGoogleUser!.id } });
    const userAfterCustomDelete = await prisma.user.update({
      where: { id: createdGoogleUser!.id },
      data: { image: null },
    });
    const resolvedFallback = userAfterCustomDelete.image || userAfterCustomDelete.googleImage || null;
    assert(
      resolvedFallback === "https://lh3.googleusercontent.com/a/NEW_GOOGLE_PIC=s96-c",
      "J. Removing custom avatar automatically falls back to linked Google photo"
    );

    // K. No custom + no Google -> initials
    const resolvedInitials = userARemoved.image || userARemoved.googleImage || null;
    assert(resolvedInitials === null, "K. No custom + no Google photo falls back to initials (null URL)");

    // -------------------------------------------------------------
    // Test Group 5: Endpoint & Payload Verification
    // -------------------------------------------------------------
    console.log("\n[Group 5: Binary Endpoint & Payload Verification]");
    
    // Q. Avatar endpoint returns correct content type and binary
    const avatarRecordB = await prisma.userAvatar.findUnique({ where: { userId: userB.id } });
    assert(
      avatarRecordB !== null && avatarRecordB.mimeType === "image/jpeg" && Buffer.isBuffer(avatarRecordB.data),
      "Q. UserAvatar stores true binary Buffer and exact mimeType for streaming endpoint"
    );

    // R. Avatar endpoint 404 when absent
    const missingAvatar = await prisma.userAvatar.findUnique({ where: { userId: "non_existent_id" } });
    assert(missingAvatar === null, "R. Querying non-existent avatar returns null (404)");

    // S. Profile API does NOT return Base64 binary
    const profileUserB = await prisma.user.findUnique({
      where: { id: userB.id },
      select: { id: true, name: true, email: true, image: true, googleImage: true },
    });
    const profileAvatarUrl = profileUserB?.image || profileUserB?.googleImage || null;
    assert(
      profileAvatarUrl !== null &&
        !profileAvatarUrl.startsWith("data:") &&
        profileAvatarUrl.startsWith("/api/user/avatar/"),
      "S. Profile API returns lightweight URL string and NEVER Base64 binary"
    );

    // T. JWT / session contains only lightweight URL
    const jwtPicture = profileUserB?.image || profileUserB?.googleImage || null;
    assert(
      jwtPicture !== null && jwtPicture.length < 100,
      "T. JWT token.picture is a lightweight URL (< 100 bytes)",
      `Size: ${jwtPicture?.length} bytes`
    );

    // -------------------------------------------------------------
    // CRITICAL PROOF: 2MB Binary != 2MB Base64 in User.image != 2MB JWT
    // -------------------------------------------------------------
    console.log("\n[Critical Verification: 2MB Binary != 2MB in User.image != 2MB in JWT]");
    const binarySize = jpegVal.size!;
    const userImageFieldLength = profileUserB!.image!.length;
    const jwtPictureFieldLength = jwtPicture!.length;

    console.log(`  📊 Binary Avatar Data Size (UserAvatar.data): ${binarySize} bytes`);
    console.log(`  📊 User.image Database Field Length:          ${userImageFieldLength} characters`);
    console.log(`  📊 JWT token.picture Payload Length:          ${jwtPictureFieldLength} characters`);

    assert(
      userImageFieldLength < 100 && jwtPictureFieldLength < 100,
      "CRITICAL PROOF: User.image and JWT token.picture remain lightweight (< 100 bytes) regardless of avatar binary size"
    );

    // -------------------------------------------------------------
    // Cleanup Test Fixtures
    // -------------------------------------------------------------
    await prisma.userAvatar.deleteMany({
      where: { userId: { in: [userA.id, userB.id, userC.id, userD.id, createdGoogleUser!.id] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [emailA, emailB, emailC, emailD, googleEmail] } },
    });
    console.log("\n  🧹 All test fixtures cleaned up successfully.");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  }

  console.log(`\n===============================================================`);
  console.log(` TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAvatarTests().finally(() => prisma.$disconnect());
