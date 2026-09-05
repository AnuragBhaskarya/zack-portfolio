export async function onRequestGet(context) {
  const db = context.env.DB;
  const res = await db.prepare("SELECT * FROM faqs ORDER BY display_order ASC").all();
  return new Response(JSON.stringify(res.results || []), { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  const data = await context.request.json();
  const id = crypto.randomUUID();
  const display_order = Date.now();
  await db.prepare("INSERT INTO faqs (id, question, answer, display_order) VALUES (?, ?, ?, ?)")
    .bind(id, data.question, data.answer, display_order).run();
  return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPut(context) {
  const db = context.env.DB;
  const payload = await context.request.json();
  if (Array.isArray(payload)) {
    const stmts = payload.map(item => 
      db.prepare("UPDATE faqs SET display_order = ? WHERE id = ?").bind(item.display_order, item.id)
    );
    await db.batch(stmts);
  } else {
    // Update individual record
    await db.prepare("UPDATE faqs SET question = ?, answer = ? WHERE id = ?")
      .bind(payload.question, payload.answer, payload.id).run();
  }
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}

export async function onRequestDelete(context) {
  const db = context.env.DB;
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  await db.prepare("DELETE FROM faqs WHERE id = ?").bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}
