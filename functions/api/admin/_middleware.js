export async function onRequest(context) {
  const { request, env, next } = context;
  
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      }
    });
  }

  const url = new URL(request.url);
  if (url.pathname === '/api/admin/auth') {
    return next();
  }

  const authHeader = request.headers.get("Authorization");
  const expectedPassword = env.ADMIN_PASSWORD || "admin123";

  if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  return next();
}
