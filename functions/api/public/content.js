export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  
  try {
    // Auto-initialize tables for local dev / first run
    await db.exec(`
      CREATE TABLE IF NOT EXISTS thumbnails (id TEXT PRIMARY KEY, image_base64 TEXT NOT NULL, display_order INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS faqs (id TEXT PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL, display_order INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, client_name TEXT NOT NULL, role TEXT, quote TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 5, avatar_base64 TEXT, display_order INTEGER NOT NULL);
    `);

    const thumbnailsPromise = db.prepare("SELECT * FROM thumbnails ORDER BY display_order ASC").all();
    const faqsPromise = db.prepare("SELECT * FROM faqs ORDER BY display_order ASC").all();
    const reviewsPromise = db.prepare("SELECT * FROM reviews ORDER BY display_order ASC").all();
    
    const [thumbnails, faqs, reviews] = await Promise.all([thumbnailsPromise, faqsPromise, reviewsPromise]);
    
    return new Response(JSON.stringify({
      thumbnails: thumbnails.results || [],
      faqs: faqs.results || [],
      reviews: reviews.results || []
    }), {
      headers: { 
        "Content-Type": "application/json", 
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" 
      }
    });
  } catch (err) {
    // If table doesn't exist yet, return empty arrays (for initial load)
    return new Response(JSON.stringify({
      thumbnails: [],
      faqs: [],
      reviews: []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
