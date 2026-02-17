/**
 * Product Research Bot for Stories to Amaze
 * Finds trending Amazon products suitable for story generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeProducts } from './scrape-amazon-products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

/**
 * Trending product ideas based on 2026 Amazon trends
 * Source: Real Amazon best seller data
 */
const TRENDING_CATEGORIES = {
  electronics: [
    'wireless earbuds', 'smart home devices', 'phone accessories',
    'portable chargers', 'bluetooth speakers', 'streaming devices'
  ],
  home: [
    'air purifiers', 'robot vacuums', 'smart thermostats',
    'security cameras', 'kitchen gadgets', 'storage solutions'
  ],
  kitchen: [
    'air fryers', 'instant pots', 'coffee makers',
    'knife sets', 'food processors', 'meal prep containers'
  ],
  pets: [
    'cat toys', 'dog training tools', 'pet cameras',
    'automatic feeders', 'pet beds', 'grooming tools'
  ],
  health: [
    'fitness trackers', 'yoga mats', 'resistance bands',
    'water bottles', 'supplements', 'massage guns'
  ],
  family: [
    'educational toys', 'baby monitors', 'kids books',
    'family games', 'outdoor toys', 'art supplies'
  ],
  safety: [
    'fire blankets', 'carbon monoxide detectors', 'first aid kits',
    'emergency supplies', 'baby safety products', 'home security'
  ]
};

/**
 * Use Google AI to research product keywords and trends
 */
async function researchProductKeywords(productType, category) {
  const prompt = `You are an Amazon affiliate marketing expert researching products for story-based content.

Product type: ${productType}
Category: ${category}

Task: Research what people search for when looking for this product.

Provide:
1. Primary search keyword (what most people search)
2. 3-5 related keywords
3. Common problem this product solves
4. Target audience (who buys this)
5. Typical price range

Format as JSON:
{
  "primaryKeyword": "best [product]",
  "relatedKeywords": ["keyword1", "keyword2", "keyword3"],
  "problem": "The main problem this solves",
  "audience": "Who typically buys this",
  "priceRange": "$XX-$YY"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content.parts[0].text;

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/```json\n?(.*?)\n?```/s) || text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonText);
      }
    }

    return null;
  } catch (error) {
    console.error('Error researching keywords:', error);
    return null;
  }
}

/**
 * Find real Amazon products using web scraping
 */
async function findAmazonProducts(keyword, category) {
  // Scrape real Amazon products for this category
  const products = await scrapeProducts(category, 10);

  if (products.length === 0) {
    console.log(`  ⚠️  No products found for ${category}`);
    return null;
  }

  // Try to find one that matches the keyword
  const lowerKeyword = keyword.toLowerCase();
  const words = lowerKeyword.split(' ').filter(w => w.length > 3);

  // Score each product by keyword match
  const scored = products.map(p => {
    const lowerName = p.name.toLowerCase();
    const score = words.reduce((s, w) => s + (lowerName.includes(w) ? 1 : 0), 0);
    return { ...p, matchScore: score };
  });

  // Return best match, or first product if no keyword match
  scored.sort((a, b) => b.matchScore - a.matchScore);
  const best = scored[0];

  return {
    name: best.name,
    asin: best.asin,
    estimatedPrice: best.price,
    description: `${best.name} - available on Amazon`,
    url: best.affiliateUrl,
  };
}

/**
 * Score a product idea for story potential
 */
function scoreProductIdea(productData) {
  let score = 0;
  const reasons = [];

  // Check price range (sweet spot: $20-$150)
  const priceMatch = productData.priceRange?.match(/\$(\d+)/);
  if (priceMatch) {
    const minPrice = parseInt(priceMatch[1]);
    if (minPrice >= 20 && minPrice <= 150) {
      score += 30;
      reasons.push('Good price range for affiliate');
    } else if (minPrice < 20) {
      score += 10;
      reasons.push('Low price - lower commission');
    }
  }

  // Check if problem is relatable
  if (productData.problem && productData.problem.length > 20) {
    score += 25;
    reasons.push('Clear, relatable problem');
  }

  // Check if audience is defined
  if (productData.audience && productData.audience.length > 10) {
    score += 20;
    reasons.push('Well-defined audience');
  }

  // Check keyword search volume potential
  if (productData.primaryKeyword) {
    score += 25;
    reasons.push('Has primary search keyword');
  }

  return { score, reasons };
}

/**
 * Generate product research report
 */
async function generateProductReport(category, numProducts = 5) {
  console.log(`\n🔍 Researching ${numProducts} products in category: ${category}\n`);

  const productTypes = TRENDING_CATEGORIES[category] || [];
  const reports = [];

  for (let i = 0; i < Math.min(numProducts, productTypes.length); i++) {
    const productType = productTypes[i];

    console.log(`📊 Researching: ${productType}...`);

    // Research keywords and trends
    const research = await researchProductKeywords(productType, category);

    if (!research) {
      console.log(`  ❌ Failed to research ${productType}`);
      continue;
    }

    // Find actual products using real Amazon scraping
    const product = await findAmazonProducts(research.primaryKeyword, category);

    // Score the idea
    const { score, reasons } = scoreProductIdea(research);

    const report = {
      productType,
      category,
      ...research,
      suggestedProduct: product,
      score,
      scoreReasons: reasons,
      readyForStory: score >= 60
    };

    reports.push(report);

    console.log(`  ✅ Score: ${score}/100`);
    console.log(`  📝 Keyword: ${research.primaryKeyword}`);
    console.log(`  💰 Price: ${research.priceRange}`);
    console.log(`  ${report.readyForStory ? '✨ Ready for story!' : '⏸️  Needs improvement'}`);
    console.log('');

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return reports;
}

/**
 * Save research results
 */
function saveResearchResults(reports, category) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `product-research-${category}-${timestamp}.json`;
  const filepath = path.join(__dirname, '..', 'data', filename);

  // Ensure data directory exists
  const dataDir = path.dirname(filepath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(reports, null, 2));

  console.log(`\n💾 Results saved to: ${filepath}`);
  console.log(`\n📈 Summary:`);
  console.log(`  Total researched: ${reports.length}`);
  console.log(`  Ready for stories: ${reports.filter(r => r.readyForStory).length}`);
  console.log(`  Average score: ${Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length)}/100`);

  return filepath;
}

/**
 * Main research function
 */
async function researchProducts(category = 'pets', numProducts = 5) {
  const validCategories = Object.keys(TRENDING_CATEGORIES);

  if (!validCategories.includes(category)) {
    console.error(`❌ Invalid category. Choose from: ${validCategories.join(', ')}`);
    return;
  }

  const reports = await generateProductReport(category, numProducts);
  const filepath = saveResearchResults(reports, category);

  return { reports, filepath };
}

// Export for use in other scripts
export { researchProducts, TRENDING_CATEGORIES };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const category = process.argv[2] || 'pets';
  const numProducts = parseInt(process.argv[3]) || 3;

  researchProducts(category, numProducts)
    .then(result => {
      console.log('\n✅ Research complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}
