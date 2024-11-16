import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/lib/db";

type Params = Promise<{ id: string }>

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export async function GET(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const id = params.id;
  const db = await getDb();

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const hashedIP = hashIP(ip);

  // Get total votes and user's vote status
  const stats = await db.get(
    `SELECT 
      COUNT(*) as totalVotes,
      EXISTS(
        SELECT 1 FROM suggestion_votes 
        WHERE suggestion_id = ? AND hashed_ip = ?
      ) as hasVoted
    FROM suggestion_votes 
    WHERE suggestion_id = ?`,
    [id, hashedIP, id]
  );

  return NextResponse.json(stats);
}

export async function POST(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const db = await getDb();
  const { id } = params;

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const hashedIP = hashIP(ip);

  await db.run('BEGIN TRANSACTION');

  try {
    // Check if suggestion exists
    const suggestion = await db.get(
      'SELECT id FROM story_suggestions WHERE id = ?',
      [id]
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Insert vote or return error if already voted
    const result = await db.run(
      `INSERT INTO suggestion_votes (suggestion_id, hashed_ip, vote_count)
       VALUES (?, ?, 1)
       ON CONFLICT(suggestion_id, hashed_ip) DO NOTHING`,
      [id, hashedIP]
    );

    if (result.changes === 0) {
      await db.run('ROLLBACK');
      return NextResponse.json(
        { error: 'Already voted' },
        { status: 400 }
      );
    }

    await db.run('COMMIT');

    // Get updated vote count
    const stats = await db.get(
      `SELECT 
        COUNT(*) as totalVotes,
        1 as hasVoted
       FROM suggestion_votes 
       WHERE suggestion_id = ?`,
      [id]
    );

    return NextResponse.json(stats);
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
} 