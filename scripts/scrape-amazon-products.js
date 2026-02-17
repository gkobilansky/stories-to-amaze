/**
 * Amazon Product Scraper
 * Scrapes Amazon best sellers to find real products with ASINs
 */

import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AFFILIATE_TAG = 'flowathl-20';

// Amazon best seller URLs by category
const BEST_SELLER_URLS = {
  electronics: 'https://www.amazon.com/Best-Sellers-Electronics-Earbud-In-Ear-Headphones/zgbs/electronics/12097478011',
  kitchen: 'https://www.amazon.com/Best-Sellers-Kitchen-Dining/zgbs/kitchen',
  home: 'https://www.amazon.com/Best-Sellers-Home-Garden/zgbs/garden',
  pets: 'https://www.amazon.com/Best-Sellers-Pet-Supplies/zgbs/pet-supplies',
  health: 'https://www.amazon.com/Best-Sellers-Health-Personal-Care/zgbs/hpc',
  sports: 'https://www.amazon.com/Best-Sellers-Sports-Outdoors/zgbs/sporting-goods',
  tools: 'https://www.amazon.com/Best-Sellers-Tools-Home-Improvement/zgbs/hi',
  safety: 'https://www.amazon.com/Best-Sellers-Tools-Home-Improvement-Smoke-Carbon-Monoxide-Detectors/zgbs/hi/510182',
};

// Category-specific search pages (more reliable for scraping)
const SEARCH_URLS = {
  electronics: 'https://www.amazon.com/s?k=best+wireless+earbuds&s=review-rank',
  kitchen: 'https://www.amazon.com/s?k=best+kitchen+gadgets&s=review-rank',
  home: 'https://www.amazon.com/s?k=best+home+gadgets&s=review-rank',
  pets: 'https://www.amazon.com/s?k=best+cat+toys&s=review-rank',
  health: 'https://www.amazon.com/s?k=fitness+tracker&s=review-rank',
  sports: 'https://www.amazon.com/s?k=resistance+bands&s=review-rank',
  tools: 'https://www.amazon.com/s?k=useful+home+tools&s=review-rank',
  safety: 'https://www.amazon.com/s?k=home+safety+products&s=review-rank',
  family: 'https://www.amazon.com/s?k=family+board+games&s=review-rank',
};

/**
 * Extract ASIN from Amazon URL
 */
function extractASIN(url) {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

/**
 * Scrape Amazon search results for products
 */
async function scrapeAmazonProducts(category = 'electronics', maxProducts = 5) {
  console.log(`\n🔍 Scraping Amazon for ${category} products...`);

  const searchUrl = SEARCH_URLS[category] || SEARCH_URLS.electronics;

  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1280,800',
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const products = [];

  try {
    console.log(`  📡 Loading: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if we got a CAPTCHA
    const title = await page.title();
    if (title.includes('Robot') || title.includes('CAPTCHA')) {
      console.log('  ⚠️  CAPTCHA detected, trying alternative approach...');
      await browser.close();
      return [];
    }

    console.log(`  ✅ Page loaded: ${title}`);

    // Extract product data from search results
    const rawProducts = await page.evaluate(() => {
      const results = [];

      // Try different selectors for Amazon product cards
      const selectors = [
        '[data-component-type="s-search-result"]',
        '.s-result-item[data-asin]',
        '[data-asin]',
      ];

      let items = [];
      for (const selector of selectors) {
        items = document.querySelectorAll(selector);
        if (items.length > 0) break;
      }

      items.forEach((item) => {
        const asin = item.getAttribute('data-asin');
        if (!asin || asin.length !== 10) return;

        // Get product name
        const nameEl = item.querySelector('h2 a span, h2 span, .a-size-medium, .a-size-base-plus');
        const name = nameEl?.textContent?.trim();
        if (!name || name.length < 10) return;

        // Get price
        const priceEl = item.querySelector('.a-price .a-offscreen, .a-price-whole');
        const price = priceEl?.textContent?.trim()?.replace(/[^\d.$]/g, '') || '';

        // Get rating
        const ratingEl = item.querySelector('.a-icon-star-small .a-icon-alt, [class*="star"] .a-icon-alt');
        const rating = ratingEl?.textContent?.trim() || '';

        // Get review count
        const reviewEl = item.querySelector('[aria-label*="stars"] + span, .a-size-small .a-link-normal');
        const reviews = reviewEl?.textContent?.trim() || '';

        // Get product URL
        const linkEl = item.querySelector('h2 a, a.a-link-normal[href*="/dp/"]');
        const url = linkEl?.href || '';

        if (asin && name) {
          results.push({ asin, name, price, rating, reviews, url });
        }
      });

      return results;
    });

    console.log(`  📦 Found ${rawProducts.length} raw products`);

    // Filter and clean up products
    for (const product of rawProducts.slice(0, maxProducts * 2)) {
      if (!product.asin || !product.name) continue;

      // Skip sponsored or weird results
      if (product.name.length > 200) continue;

      const cleanProduct = {
        asin: product.asin,
        name: product.name.replace(/\s+/g, ' ').trim(),
        price: product.price ? `$${product.price.replace('$', '')}` : 'Check Amazon',
        rating: product.rating || 'N/A',
        url: `https://amazon.com/dp/${product.asin}?tag=${AFFILIATE_TAG}`,
        affiliateUrl: `https://amazon.com/dp/${product.asin}?tag=${AFFILIATE_TAG}`,
        category,
      };

      products.push(cleanProduct);

      if (products.length >= maxProducts) break;
    }

  } catch (error) {
    console.error(`  ❌ Scraping error: ${error.message}`);
  } finally {
    await browser.close();
  }

  return products;
}

/**
 * Save scraped products to data file
 */
function saveProducts(products, category) {
  const dataDir = path.join(__dirname, '..', 'data', 'products');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${category}-${timestamp}.json`;
  const filepath = path.join(dataDir, filename);

  // Also update the "latest" file for this category
  const latestPath = path.join(dataDir, `${category}-latest.json`);

  const data = {
    category,
    scrapedAt: new Date().toISOString(),
    products,
  };

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));

  console.log(`\n💾 Saved ${products.length} products to: ${filename}`);
  return filepath;
}

/**
 * Load previously scraped products for a category
 */
function loadProducts(category) {
  const latestPath = path.join(__dirname, '..', 'data', 'products', `${category}-latest.json`);
  if (fs.existsSync(latestPath)) {
    const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    return data.products || [];
  }
  return [];
}

/**
 * Main scraper function
 */
async function scrapeProducts(category = 'electronics', maxProducts = 5, forceFresh = false) {
  // Check if we have recent data (< 24 hours old)
  if (!forceFresh) {
    const latestPath = path.join(__dirname, '..', 'data', 'products', `${category}-latest.json`);
    if (fs.existsSync(latestPath)) {
      const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      const age = Date.now() - new Date(data.scrapedAt).getTime();
      const hoursSinceScraped = age / (1000 * 60 * 60);

      if (hoursSinceScraped < 24 && data.products.length > 0) {
        console.log(`  📋 Using cached products (${Math.round(hoursSinceScraped)}h old)`);
        return data.products;
      }
    }
  }

  const products = await scrapeAmazonProducts(category, maxProducts);

  if (products.length > 0) {
    saveProducts(products, category);
  } else {
    console.log('  ⚠️  No products scraped, falling back to cache if available');
    const cached = loadProducts(category);
    if (cached.length > 0) {
      console.log(`  📋 Using ${cached.length} cached products`);
      return cached;
    }
  }

  return products;
}

// Export
export { scrapeProducts, loadProducts, SEARCH_URLS };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const category = process.argv[2] || 'electronics';
  const max = parseInt(process.argv[3]) || 5;

  console.log(`🛒 Amazon Product Scraper`);
  console.log(`Category: ${category}, Max: ${max}\n`);

  scrapeProducts(category, max, true)
    .then(products => {
      console.log(`\n✅ Found ${products.length} products:\n`);
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   ASIN: ${p.asin}`);
        console.log(`   Price: ${p.price}`);
        console.log(`   URL: ${p.affiliateUrl}`);
        console.log('');
      });
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}
