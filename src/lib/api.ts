import { Post } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  console.log(fullPath);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  console.log(data);

  return { ...data, slug: realSlug, content } as Post;
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}

export async function getSubmittedStories() {
  const response = await fetch('/api/suggest', {
    next: { revalidate: 60 }, // Revalidate cache every minute
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch submissions');
  }
  
  return response.json();
}

export async function voteForStory(suggestionId: number) {
  const response = await fetch(`/api/suggest/${suggestionId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to vote for story');
  }
  
  return response.json();
}

export async function getStoryVotes(suggestionId: number) {
  const response = await fetch(`/api/suggest/${suggestionId}/vote`, {
    next: { revalidate: 60 }, // Revalidate cache every minute
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch votes');
  }
  
  return response.json();
}
