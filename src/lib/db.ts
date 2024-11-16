import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export async function getDb() {
  if (!supabase) {
    const supabaseUrl = 'https://your-supabase-url.supabase.co';
    const supabaseKey = 'your-supabase-key';
    supabase = createClient(supabaseUrl, supabaseKey);

    const { error: error1 } = await supabase
      .from('story_suggestions')
      .select('*')
      .limit(1);

    if (error1) {
      await supabase
        .from('story_suggestions')
        .insert([{ title: 'Sample title', amazon_link: 'http://example.com', summary: 'Sample summary' }]);
    }

    const { error: error2 } = await supabase
      .from('suggestion_votes')
      .select('*')
      .limit(1);

    if (error2) {
      await supabase
        .from('suggestion_votes')
        .insert([{ suggestion_id: 1, hashed_ip: 'sample_hashed_ip', vote_count: 0 }]);
    }

    const { error: error3 } = await supabase
      .from('post_stats')
      .select('*')
      .limit(1);

    if (error3) {
      await supabase
        .from('post_stats')
        .insert([{ slug: 'sample-slug', hits: 0, likes: 0 }]);
    }

    const { error: error4 } = await supabase
      .from('post_likes')
      .select('*')
      .limit(1);

    if (error4) {
      await supabase
        .from('post_likes')
        .insert([{ slug: 'sample-slug', hashed_ip: 'sample_hashed_ip', like_count: 0 }]);
    }
  }
  return supabase;
}