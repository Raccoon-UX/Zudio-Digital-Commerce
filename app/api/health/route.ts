import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { APP_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unhealthy";
  let dbLatencyMs = 0;
  let isHealthy = false;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "healthy";
    isHealthy = true;
  } catch (error) {
    console.error("Health check database probe failed:", error);
    dbStatus = "unreachable";
    isHealthy = false;
  }

  const memoryUsage = process.memoryUsage ? process.memoryUsage() : null;
  const memoryTelemetry = memoryUsage
    ? {
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      }
    : null;

  const payload = {
    status: isHealthy ? "healthy" : "unhealthy",
    app: APP_CONFIG.name,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    telemetry: {
      memory: memoryTelemetry,
      environment: process.env.NODE_ENV || "development",
    },
    version: "1.0.0",
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
  });
}
