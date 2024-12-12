import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/lib/db";

type Params = Promise<{ slug: string }>
 
// Helper to hash IP addresses for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export async function GET(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params
  const slug = params.slug
  const supabase = await getDb();
  
  // Increment hit counter using RPC function
  const { error: updateError } = await supabase
    .rpc('increment_hits', { row_slug: slug })
    .select();

  if (updateError) throw updateError;
  
  const { data: stats, error: statsError } = await supabase
    .from('post_stats')
    .select('hits, likes')
    .eq('slug', slug)
    .single();
  
  if (statsError) throw statsError;
  
  return NextResponse.json(stats);
}

export async function POST(request: Request, segmentData: { params: Params }) {
  const params = await segmentData.params
  const { slug } = params;
  const supabase = await getDb();

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const hashedIP = hashIP(ip);
  
  // Check user's like count
  const { data: userLikes, error: likesError } = await supabase
    .from('post_likes')
    .select('like_count')
    .eq('slug', slug)
    .eq('hashed_ip', hashedIP)
    .single();
  
  if (likesError && likesError.code !== 'PGRST116') throw likesError;
  
  if (userLikes?.like_count >= 16) {
    return NextResponse.json(
      { error: 'Maximum likes reached' }, 
      { status: 400 }
    );
  }
  
  try {
    // Update or insert user likes
    const { error: likesUpdateError } = await supabase
      .from('post_likes')
      .upsert(
        { 
          slug, 
          hashed_ip: hashedIP, 
          like_count: (userLikes?.like_count || 0) + 1 
        },
        { 
          onConflict: 'slug,hashed_ip',
          ignoreDuplicates: false
        }
      );

    if (likesUpdateError) throw likesUpdateError;

    // Then update the post_stats table
    const { error: statsUpdateError } = await supabase
      .rpc('increment_likes', { row_slug: slug })  // Call RPC directly
      .select();

    if (statsUpdateError) throw statsUpdateError;
    
    // Get updated stats with joined user likes
    const { data: stats, error: statsError } = await supabase
      .from('post_stats')
      .select(`
        likes,
        post_likes(like_count)
      `)
      .eq('slug', slug)
      .eq('post_likes.hashed_ip', hashedIP)
      .single();
    
    if (statsError) throw statsError;
    
    // Transform the response to match the expected format
    const transformedStats = {
      likes: stats.likes,
      userLikes: stats.post_likes?.[0]?.like_count || 0
    };
    
    return NextResponse.json(transformedStats);
  } catch (error) {
    console.error('Error updating likes:', error);
    return NextResponse.json(
      { error: 'Failed to update likes' },
      { status: 500 }
    );
  }
} 