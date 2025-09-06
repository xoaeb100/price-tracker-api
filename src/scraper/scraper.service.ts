import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * NOTE:
 * - HTML structures change often; keep selector logic resilient.
 * - We use lightweight scraping with axios + cheerio.
 * - For heavy blocking, consider rotating proxies or headless browsers.
 */
@Injectable()
export class ScraperService {
  private async fetchHtml(url: string) {
    const res = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      timeout: 20000,
    });
    return res.data as string;
  }

  async scrape(
    url: string,
    platform: 'amazon' | 'flipkart' | 'croma' | 'vijaysales',
  ): Promise<{
    title: string | null;
    price: number | null;
    currency: string | null;
    imageUrl: string | null;
  }> {
    if (platform === 'amazon') return this.scrapeAmazon(url);
    else if (platform === 'croma') return this.scrapeCroma(url);
    else if (platform === 'vijaysales') return this.scrapeVijaySales(url);

    return this.scrapeFlipkart(url);
  }

  parsePrice(text: string | null): number | null {
    if (!text) return null;

    // Example input: "₹1,89,900.001,89,900.00"
    // Step 1: Keep only digits, commas, and dots (preserve formatting)
    let cleaned = text.replace(/[^\d.,]/g, '');

    // Step 2: If multiple prices are concatenated, split and take the first
    // e.g. "1,89,900.001,89,900.00" → ["1,89,900.00", "1,89,900.00"]
    if (cleaned.includes('.')) {
      const match = cleaned.match(/\d[\d,]*\.\d{2}/g);
      if (match && match.length > 0) {
        cleaned = match[0]; // take the first proper price
      }
    }

    // Step 3: Remove commas → "1,89,900.00" → "189900.00"
    cleaned = cleaned.replace(/,/g, '');

    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  private async scrapeAmazon(url: string) {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    // Title candidates
    const title =
      $('#productTitle').text().trim() ||
      $('span#title').text().trim() ||
      $('h1').first().text().trim() ||
      null;

    // Price candidates
    const priceText =
      $('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen')
        .first()
        .text()
        .trim() ||
      $('#corePrice_feature_div .a-price .a-offscreen').first().text().trim() ||
      $('#tp_price_block_total_price_ww').text().trim() ||
      $('#priceblock_ourprice').text().trim() ||
      $('#priceblock_dealprice').text().trim() ||
      $('[data-a-color="price"] .a-offscreen').first().text().trim() ||
      $('span.a-price .a-offscreen').first().text().trim() ||
      null;

    const imageUrl =
      $('#imgTagWrapperId img').attr('src') ||
      $('#imgBlkFront').attr('src') ||
      $('img#landingImage').attr('src') ||
      $('img').first().attr('src') ||
      null;

    console.log(priceText, '<_____');
    const price = this.parsePrice(priceText);
    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    return { title, price, currency, imageUrl };
  }

  async scrapeFlipkart(url: string) {
    console.log('hi flipkart');

    const browser = await puppeteer.launch({
      headless: true, // safer than true
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Pretend to be a real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // ✅ Wait for title before scraping
    await page.waitForSelector('span.B_NuCI', { timeout: 30000 });

    // Title
    const title = await page.$eval('span.B_NuCI', (el) =>
      el.textContent?.trim(),
    );

    // Price
    let priceText = '';
    try {
      await page.waitForSelector('div._30jeq3._16Jk6d', { timeout: 10000 });
      priceText = await page.$eval('div._30jeq3._16Jk6d', (el) =>
        el.textContent?.trim(),
      );
    } catch {
      console.warn('⚠️ Price not found');
    }
    const price = this.parsePrice(priceText);

    // Image (Flipkart sometimes changes classes)
    let imageUrl: string | null = '';
    try {
      imageUrl =
        (await page.$eval('img._396cs4', (el) => el.getAttribute('src'))) ||
        (await page.$eval('img._2r_T1I', (el) => el.getAttribute('src')));
    } catch {
      console.warn('⚠️ Image not found');
    }

    // Currency (default ₹ if missing)
    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    await browser.close();

    return { title, price, imageUrl, currency };
  }

  async scrapeCroma(url: string) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Title
    const title = await page.$eval('.pd-title', (el) => el.textContent?.trim());

    // Price
    const priceText = await page.$eval('.amount', (el) =>
      el.textContent?.trim(),
    );
    const price = this.parsePrice(priceText);

    // Image
    const imageUrl = await page
      .$eval(
        'img#0prod_img',
        (el) => el.getAttribute('data-src') || el.getAttribute('src'),
      )
      .catch(async () => {
        return await page
          .$eval(
            'img[data-testid="super-zoom-img-0"]',
            (el) => el.getAttribute('data-src') || el.getAttribute('src'),
          )
          .catch(() => null);
      });
    // Currency
    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    await browser.close();

    return { title, price, imageUrl, currency };
  }
  async scrapeVijaySales(url: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Fake user agent so site doesn’t block
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Safely extract elements (some products have slightly different structure)
    const title = await page
      .$eval('h1.productFullDetail__productName', (el) =>
        el.textContent?.trim(),
      )
      .catch(() => null);

    const priceText = await page
      .$eval('.product__price--price', (el) => el.textContent?.trim())
      .catch(() => null);

    const imageUrl = await page
      .$eval('.carousel__currentImage', (el) => el.getAttribute('src'))
      .catch(() => null);

    await browser.close();

    const price = this.parsePrice(priceText);
    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    return { title, price, imageUrl, currency };
  }
}
