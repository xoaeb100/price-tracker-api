import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendPriceDropEmail(params: {
    to?: string;
    title: string | null;
    url: string;
    platform: string;
    currentPrice: number;
    targetPrice: number;
    imageUrl?: string | null;
  }) {
    const to = params.to ?? process.env.NOTIFY_TO!;
    const from = process.env.MAIL_FROM || process.env.MAIL_USER!;
    const subject = `Price drop alert: ${params.title ?? params.platform}`;
    const html = `
      <div>
        <h2>Price Drop Alert</h2>
        <p><b>${params.title ?? 'Product'}</b> on <b>${params.platform}</b></p>
        <p>Current price: ${params.currentPrice}</p>
        <p>Your target price: ${params.targetPrice}</p>
        ${params.imageUrl ? `<img src="${params.imageUrl}" alt="product" style="max-width:240px"/>` : ''}
        <p><a href="${params.url}">Open product</a></p>
      </div>
    `;

    await this.transporter.sendMail({ from, to, subject, html });
  }
}
