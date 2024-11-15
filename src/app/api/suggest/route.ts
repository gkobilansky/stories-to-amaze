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

    const db = await getDb();
    await db.run(
      'INSERT INTO story_suggestions (title, amazon_link, summary) VALUES (?, ?, ?)',
      [title, amazonLink, summary]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to save suggestion' },
      { status: 500 }
    );
  }
}