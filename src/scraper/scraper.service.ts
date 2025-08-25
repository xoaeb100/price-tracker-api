import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
    platform: 'amazon' | 'flipkart',
  ): Promise<{
    title: string | null;
    price: number | null;
    currency: string | null;
    imageUrl: string | null;
  }> {
    if (platform === 'amazon') return this.scrapeAmazon(url);
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

  private async scrapeFlipkart(url: string) {
    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);

    const title =
      $('span.B_NuCI').first().text().trim() ||
      $('h1').first().text().trim() ||
      null;

    const priceText =
      $('div._30jeq3._16Jk6d').first().text().trim() ||
      $('div._25b18c ._30jeq3').first().text().trim() ||
      null;

    const imageUrl =
      $('img._396cs4').attr('src') ||
      $('img._2r_T1I').attr('src') ||
      $('img').first().attr('src') ||
      null;

    const price = this.parsePrice(priceText);
    const currency = priceText
      ? priceText.replace(/[0-9.,\s]/g, '').trim() || '₹'
      : '₹';

    return { title, price, currency, imageUrl };
  }
}
