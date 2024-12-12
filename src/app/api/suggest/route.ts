import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { title, amazonLink, summary } = await request.json();
    
    // Basic validation
    if (!title || !amazonLink || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await getDb();
    if (!supabase) {
      throw new Error('Failed to initialize database');
    }

    const { error } = await supabase
      .from('story_suggestions')
      .insert([
        { title, amazon_link: amazonLink, summary }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to save suggestion' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await getDb();
    if (!supabase) {
      throw new Error('Failed to initialize database');
    }

    const { data: suggestions, error } = await supabase
      .from('story_suggestions')
      .select('*');

    if (error) throw error;

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}