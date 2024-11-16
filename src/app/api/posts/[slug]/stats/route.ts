import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/lib/db";

// Helper to hash IP addresses for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export async function GET(context: { params: { slug: string } }) {
  const db = await getDb();
  const { slug } = context.params;
  
  // Increment hit counter and get updated stats
  await db.run(
    `INSERT INTO post_stats (slug, hits) 
     VALUES (?, 1)
     ON CONFLICT(slug) DO UPDATE SET hits = hits + 1`,
    [slug]
  );
  
  const stats = await db.get(
    'SELECT hits, likes FROM post_stats WHERE slug = ?',
    [slug]
  );
  
  return NextResponse.json(stats);
}

export async function POST(request: NextRequest, context: { params: { slug: string } }) {
  const db = await getDb();
  const { slug } = context.params;
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') ||
             'unknown';
  const hashedIP = hashIP(ip);
  
  // Check user's like count
  const userLikes = await db.get(
    'SELECT like_count FROM post_likes WHERE slug = ? AND hashed_ip = ?',
    [slug, hashedIP]
  );
  
  if (userLikes?.like_count >= 16) {
    return NextResponse.json(
      { error: 'Maximum likes reached' }, 
      { status: 400 }
    );
  }
  
  // Start a transaction to ensure data consistency
  await db.run('BEGIN TRANSACTION');
  
  try {
    // Update or insert user likes
    await db.run(
      `INSERT INTO post_likes (slug, hashed_ip, like_count)
       VALUES (?, ?, 1)
       ON CONFLICT(slug, hashed_ip) DO UPDATE SET like_count = like_count + 1`,
      [slug, hashedIP]
    );
    
    // Update total likes in post_stats
    await db.run(
      `INSERT INTO post_stats (slug, likes)
       VALUES (?, 1)
       ON CONFLICT(slug) DO UPDATE SET likes = likes + 1`,
      [slug]
    );
    
    await db.run('COMMIT');
    
    // Get updated stats
    const stats = await db.get(
      `SELECT 
        ps.likes,
        pl.like_count as userLikes
       FROM post_stats ps
       LEFT JOIN post_likes pl ON pl.slug = ps.slug AND pl.hashed_ip = ?
       WHERE ps.slug = ?`,
      [hashedIP, slug]
    );
    
    return NextResponse.json(stats);
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error updating likes:', error);
    return NextResponse.json(
      { error: 'Failed to update likes' },
      { status: 500 }
    );
  }
} 