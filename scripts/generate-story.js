/**
 * Story Generator for Stories to Amaze
 * Generates SEO-optimized stories with Google AI (Gemini + Imagen)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD4RPULijE80-Zd9_DM3perYjNlAhV4TH8';
const AMAZON_TAG = 'flowathl-20';

/**
 * Generate story text using Gemini
 */
async function generateStoryText(productName, productDescription, keywords) {
  const prompt = `Write an extraordinary adventure story (300-500 words) featuring "${productName}".

Product description: ${productDescription}

Style inspiration: Indiana Jones, J. Peterman catalog, Tomb Raider, Jack West Jr., Nina Wilde
Think: Everyday people, everyday products, EXTRAORDINARY adventures

Requirements:
- Create an epic, cinematic adventure (treasure hunt, expedition, mystery, daring escape)
- Everyday protagonist thrust into extraordinary circumstances
- The product plays a crucial role in the adventure (not the hero, but essential)
- Vivid, exotic locations or unusual settings
- High stakes but family-friendly (no graphic violence)
- Witty, adventurous tone - capture the imagination!
- Target keywords naturally: ${keywords.join(', ')}
- Include the product name: "${productName}"
- Mention the product 2-3 times as it helps in key moments

Examples of the vibe:
- "In the depths of the Amazon, archaeologist Dr. Sarah Chen's [product] was the only thing standing between her and certain doom..."
- "When the ancient map led tomb raider Marcus Webb to a frozen Himalayan peak, his [product] became more than just gear..."
- "The encrypted message arrived at midnight. Museum curator Elena Vasquez had 48 hours to decode it, armed only with her wits and a [product]..."

Make it thrilling, imaginative, and fun! Less "suburban couch," more "lost city of gold."`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    })
  });

  const data = await response.json();

  if (data.candidates && data.candidates[0]) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error('Failed to generate story: ' + JSON.stringify(data));
}

/**
 * Generate story image using Nano Banana (Gemini 2.5 Flash Image)
 */
async function generateStoryImage(imagePrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-goog-api-key': GOOGLE_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: imagePrompt }]
      }]
    })
  });

  const data = await response.json();

  if (data.candidates && data.candidates[0]) {
    const parts = data.candidates[0].content.parts;

    // Find the image data
    for (const part of parts) {
      if (part.inlineData) {
        return {
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data
        };
      }
    }
  }

  throw new Error('Failed to generate image: ' + JSON.stringify(data));
}

/**
 * Generate SEO-optimized title
 */
async function generateTitle(productName, keywords) {
  const prompt = `Create an adventurous, captivating title (under 60 characters) for an extraordinary adventure story featuring "${productName}".

The title should:
- Include the keyword: "${keywords[0]}"
- Sound like an adventure novel or treasure hunt
- Be intriguing and cinematic
- Capture imagination, not just solve a problem

Style inspiration: Indiana Jones, J. Peterman, Tomb Raider

Examples of the vibe:
- "The [Product] That Unlocked Machu Picchu"
- "Lost City Found: Armed With Only a [Product]"
- "The Last Expedition's Secret: A [Product]"
- "Desert Crossing: When a [Product] Saves Everything"
- "The Cave of Wonders and One Essential [Product]"

Return ONLY the title, nothing else.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();

  if (data.candidates && data.candidates[0]) {
    return data.candidates[0].content.parts[0].text.trim();
  }

  return productName; // Fallback
}

/**
 * Generate meta description for SEO
 */
async function generateMetaDescription(story) {
  const prompt = `Write a compelling meta description (150-155 characters) for this story:

${story.substring(0, 500)}...

Requirements:
- Exactly 150-155 characters
- Include emotional hook
- Encourage clicks
- SEO-friendly

Return ONLY the meta description, nothing else.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();

  if (data.candidates && data.candidates[0]) {
    return data.candidates[0].content.parts[0].text.trim();
  }

  return story.substring(0, 155); // Fallback
}

/**
 * Create markdown file for the story
 */
function createMarkdownFile(data) {
  const slug = data.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const frontmatter = `---
title: ${data.title}
product:
  amazonId: '${data.productASIN}'
  name: '${data.productName}'
  price: '${data.productPrice}'
  image: '/assets/blog/${slug}/${slug}.png'
  url: '${data.productURL}'
date: "${new Date().toISOString().split('T')[0]}"
excerpt: "${data.metaDescription}"
coverImage: "/assets/blog/${slug}/${slug}.png"
author:
  name: Stories to Amaze
  picture: "/assets/blog/authors/default.png"
ogImage:
  url: "/assets/blog/${slug}/${slug}.png"
keywords: "${data.keywords.join(', ')}"
categories: ${JSON.stringify(data.categories)}
---

${data.story}
`;

  return { slug, frontmatter };
}

/**
 * Save image to file
 */
function saveImage(base64Data, slug) {
  const imageDir = path.join(__dirname, '..', 'public', 'assets', 'blog', slug);

  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  const imagePath = path.join(imageDir, `${slug}.png`);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(imagePath, buffer);

  return imagePath;
}

/**
 * Main story generation function
 */
async function generateStory(productInfo) {
  console.log('🎨 Generating story for:', productInfo.name);

  // Step 1: Generate title
  console.log('📝 Generating title...');
  const title = await generateTitle(productInfo.name, productInfo.keywords);
  console.log('✅ Title:', title);

  // Step 2: Generate story text
  console.log('📖 Generating story...');
  const story = await generateStoryText(
    productInfo.name,
    productInfo.description,
    productInfo.keywords
  );
  console.log('✅ Story generated:', story.length, 'characters');

  // Step 3: Generate meta description
  console.log('🔍 Generating meta description...');
  const metaDescription = await generateMetaDescription(story);
  console.log('✅ Meta description:', metaDescription);

  // Step 4: Generate image
  console.log('🖼️  Generating image...');
  const imagePrompt = `Create an epic, cinematic illustration for an adventure story featuring ${productInfo.name}.
Style: Movie poster, adventure novel cover art, National Geographic meets Indiana Jones
Scene: Dramatic, exotic location (jungle ruins, desert dunes, mountain peaks, ancient temple)
Include: The product being used in a thrilling moment of the adventure
Mood: Adventurous, mysterious, awe-inspiring
Colors: Rich, cinematic, dramatic lighting
DO NOT include any text in the image.`;

  const imageData = await generateStoryImage(imagePrompt);
  console.log('✅ Image generated');

  // Step 5: Create markdown file
  const storyData = {
    title,
    story,
    metaDescription,
    productASIN: productInfo.asin,
    productName: productInfo.name,
    productPrice: productInfo.price,
    productURL: productInfo.url,
    keywords: productInfo.keywords,
    categories: productInfo.categories || ['products']
  };

  const { slug, frontmatter } = createMarkdownFile(storyData);

  // Save image
  const imagePath = saveImage(imageData.data, slug);
  console.log('✅ Image saved:', imagePath);

  // Save markdown
  const postsDir = path.join(__dirname, '..', '_posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const markdownPath = path.join(postsDir, `${slug}.md`);
  fs.writeFileSync(markdownPath, frontmatter);
  console.log('✅ Story saved:', markdownPath);

  return {
    slug,
    title,
    markdownPath,
    imagePath
  };
}

// Export for use in other scripts
export { generateStory };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  // Example usage
  const exampleProduct = {
    name: 'Wireless Bluetooth Headphones',
    description: 'Noise-canceling over-ear headphones with 30-hour battery life',
    asin: 'B0EXAMPLE',
    price: '$79.99',
    url: 'https://amzn.to/example',
    keywords: ['best bluetooth headphones', 'noise canceling headphones', 'wireless headphones'],
    categories: ['electronics', 'audio']
  };

  generateStory(exampleProduct)
    .then(result => {
      console.log('\n🎉 Story generated successfully!');
      console.log('Slug:', result.slug);
      console.log('Title:', result.title);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
