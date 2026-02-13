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
  const prompt = `Write an engaging, family-friendly story (300-500 words) about a product called "${productName}".

Product description: ${productDescription}

Requirements:
- Create a relatable problem/situation that the product solves
- Include authentic characters (family, pets, everyday people)
- Natural product integration (don't make it the main focus)
- Conversational, warm tone (not flowery or over-the-top)
- Target keywords naturally: ${keywords.join(', ')}
- Include the product name exactly as written: "${productName}"
- Mention the product 2-3 times naturally in the story
- End with a satisfying resolution showing the product's impact

Style: Similar to a short blog post or customer review story. Authentic and helpful, not salesy.`;

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
  const prompt = `Create a compelling blog post title (under 60 characters) for a story about "${productName}".

The title should:
- Include the primary keyword: "${keywords[0]}"
- Be click-worthy and emotional
- Not be generic or boring
- Feel authentic, not clickbait-y

Examples of good titles:
- "This $20 Cat Toy Saved Our Furniture"
- "How a Fire Blanket Became Our Kitchen Hero"
- "The Pressure Cooker That Changed Dinnertime"

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
  const imagePrompt = `Create a warm, family-friendly illustration for a story about ${productInfo.name}.
Style: children's book illustration, warm colors, inviting and relatable.
Scene: Show the product in use in a cozy, everyday setting.
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
