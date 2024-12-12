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
  const supabase = await getDb();

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const hashedIP = hashIP(ip);

  // Get total votes and user's vote status
  const { data: stats, error } = await supabase
    .from('suggestion_votes')
    .select('count(*)')
    .eq('suggestion_id', id)
    .select(`
      suggestion_id,
      count(*) as totalVotes,
      (
        select count(*) > 0 
        from suggestion_votes 
        where suggestion_id = ${id} 
        and hashed_ip = '${hashedIP}'
      ) as hasVoted
    `)
    .single();

  if (error) throw error;
  return NextResponse.json(stats);
}

export async function POST(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params;
  const supabase = await getDb();
  const { id } = params;

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const hashedIP = hashIP(ip);

  try {
    // Check if suggestion exists
    const { data: suggestion, error: suggestionError } = await supabase
      .from('story_suggestions')
      .select('id')
      .eq('id', id)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    // Try to insert vote
    const { error: voteError } = await supabase
      .from('suggestion_votes')
      .insert([
        { suggestion_id: id, hashed_ip: hashedIP, vote_count: 1 }
      ]);

    if (voteError?.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Already voted' },
        { status: 400 }
      );
    }
    if (voteError) throw voteError;

    // Get updated vote count
    const { data: stats, error: statsError } = await supabase
      .from('suggestion_votes')
      .select(`
        suggestion_id,
        count(*) as totalVotes
      `)
      .eq('suggestion_id', id)
      .single();

    if (statsError) throw statsError;

    return NextResponse.json({ ...stats, hasVoted: true });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
} 