import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// 🔹 Map platform → function to build product URL from productId
const PLATFORM_URLS: Record<
  'amazon' | 'flipkart' | 'croma' | 'vijaysales',
  (id: string) => string
> = {
  amazon: (id) => `https://www.amazon.in/dp/${id}`,
  flipkart: (id) => `https://www.flipkart.com/product/p/${id}`, // ⚠️ Flipkart URLs are tricky, may need full slug later
  croma: (id) => `https://www.croma.com/-/p/${id}`,
  vijaysales: (id) => `https://www.vijaysales.com/p/${id}`,
};

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
    platform: 'amazon' | 'flipkart' | 'croma' | 'vijaysales',
    productId: string,
  ): Promise<{
    title: string | null;
    price: number | null;
    currency: string | null;
    imageUrl: string | null;
  }> {
    if (!PLATFORM_URLS[platform]) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Build URL from productId
    const url = PLATFORM_URLS[platform](productId);
    console.log(`🔗 Scraping: ${url}`);

    if (platform === 'amazon') return this.scrapeAmazon(url);
    else if (platform === 'croma') return this.scrapeCroma(url);
    else if (platform === 'vijaysales') return this.scrapeVijaySales(url);

    return this.scrapeFlipkart(url);
  }

  parsePrice(text: string | null): number | null {
    if (!text) return null;

    let cleaned = text.replace(/[^\d.,]/g, '');
    if (cleaned.includes('.')) {
      const match = cleaned.match(/\d[\d,]*\.\d{2}/g);
      if (match && match.length > 0) {
        cleaned = match[0];
      }
    }
    cleaned = cleaned.replace(/,/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  // -------- AMAZON --------
  private async scrapeAmazon(url: string) {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title =
      $('#productTitle').text().trim() ||
      $('span#title').text().trim() ||
      $('h1').first().text().trim() ||
      null;

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

    const price = this.parsePrice(priceText);
    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    return { title, price, currency, imageUrl };
  }

  // -------- FLIPKART --------
  async scrapeFlipkart(url: string) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('span.B_NuCI', { timeout: 30000 });

    const title = await page.$eval('span.B_NuCI', (el) =>
      el.textContent?.trim(),
    );

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

    let imageUrl: string | null = null;
    try {
      imageUrl =
        (await page.$eval('img._396cs4', (el) => el.getAttribute('src'))) ||
        (await page.$eval('img._2r_T1I', (el) => el.getAttribute('src')));
    } catch {
      console.warn('⚠️ Image not found');
    }

    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    await browser.close();
    return { title, price, imageUrl, currency };
  }

  // -------- CROMA --------
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

    const title = await page.$eval('.pd-title', (el) => el.textContent?.trim());
    const priceText = await page.$eval('.amount', (el) =>
      el.textContent?.trim(),
    );
    const price = this.parsePrice(priceText);

    const imageUrl = await page
      .$eval(
        'img#0prod_img',
        (el) => el.getAttribute('data-src') || el.getAttribute('src'),
      )
      .catch(async () =>
        page
          .$eval(
            'img[data-testid="super-zoom-img-0"]',
            (el) => el.getAttribute('data-src') || el.getAttribute('src'),
          )
          .catch(() => null),
      );

    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    await browser.close();
    return { title, price, imageUrl, currency };
  }

  // -------- VIJAY SALES --------
  async scrapeVijaySales(url: string) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

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
