import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './stories.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS story_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amazon_link TEXT NOT NULL,
        summary TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_stats (
        slug TEXT PRIMARY KEY,
        hits INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS post_likes (
        slug TEXT,
        hashed_ip TEXT,
        like_count INTEGER DEFAULT 0,
        PRIMARY KEY (slug, hashed_ip)
      );
    `);
  }
  return db;
}