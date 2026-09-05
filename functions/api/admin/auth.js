export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const correctPassword = env.ADMIN_PASSWORD || 'admin123';
    
    if (body.password === correctPassword) {
      return new Response(JSON.stringify({ success: true, token: body.password }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
}
