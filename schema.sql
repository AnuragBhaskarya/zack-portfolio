DROP TABLE IF EXISTS thumbnails;
CREATE TABLE thumbnails (
  id TEXT PRIMARY KEY,
  image_base64 TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

DROP TABLE IF EXISTS faqs;
CREATE TABLE faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  role TEXT,
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  avatar_base64 TEXT,
  display_order INTEGER NOT NULL
);
