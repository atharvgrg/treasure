import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 60)} minutes ${Math.floor(uptime % 60)} seconds`,
        memory: {
          used: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        },
        environment: process.env.NODE_ENV || "development",
        message: "Treasure in the Shell backend is running smoothly! 🚀",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: "unhealthy",
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
