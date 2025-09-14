import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  async sendPriceDropEmail(params: {
    to?: string;
    title: string | null;
    url: string;
    platform: string;
    currentPrice: number;
    minPrice: number;
    imageUrl?: string | null;
    customerEmail: string | any;
    messageType?: 'PRICE_DROP' | 'PRICE_HIGH';
  }) {
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP Error:', error);
      } else {
        console.log('Server is ready to send emails:', success);
      }
    });

    const to = params.customerEmail;
    const from = 'shoaib100aib@gmail.com';
    const subject = `🔥 Price Drop Alert: ${params.title ?? params.platform} 🎉`;
    const html1 = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fdfbfb, #ebedee); padding: 30px; color: #333;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; padding: 35px; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.12);">
      
      <h2 style="color: #28a745; font-size: 30px; text-align: center; margin-bottom: 10px;">
        🚨 Price Drop Detected!
      </h2>
      <p style="font-size: 18px; text-align: center; color: #555; margin-bottom: 25px;">
        Great news! A product you're watching just dropped in price.
      </p>
      
      <div style="background: #f9fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px dashed #ddd;">
        <p style="font-size: 18px; text-align: center; margin: 0 0 10px;">
          <strong style="color: #222;">${params.title ?? 'Product'}</strong><br/> 
          on <strong style="color: #007bff;">${params.platform}</strong>
        </p>
        
        <p style="font-size: 22px; text-align: center; margin: 12px 0; font-weight: bold;">
          💰 Now at: <span style="color: #28a745;">₹${params.currentPrice}</span>
        </p>
        <p style="font-size: 16px; text-align: center; margin: 5px 0; color: #888;">
          (Your target: ₹${params.minPrice})
        </p>
      </div>

      ${
        params.imageUrl
          ? `
        <div style="text-align: center; margin: 25px 0;">
          <img src="${params.imageUrl}" alt="Product Image" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);" />
        </div>
      `
          : ''
      }

      <div style="text-align: center; margin-top: 20px;">
        <a href="${params.url}" style="background: linear-gradient(45deg, #28a745, #85e085); color: #ffffff; padding: 14px 30px; font-size: 17px; font-weight: bold; text-decoration: none; border-radius: 50px; display: inline-block; box-shadow: 0 4px 12px rgba(40,167,69,0.3); transition: all 0.3s;">
          👉 View Product Now
        </a>
      </div>

      <div style="margin-top: 40px; font-size: 14px; text-align: center; color: #aaa; line-height: 1.5;">
        <p>⚡ You’re receiving this email because you set a price alert for this product.</p>
        <p>If you’d like to stop receiving these notifications, you can <a href="#" style="color: #007bff; text-decoration: none;">unsubscribe here</a> ❌</p>
      </div>
    </div>
  </div>
`;

    const html2 = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fff5f5, #fbeaea); padding: 30px; color: #333;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; padding: 35px; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.12);">
      
      <h2 style="color: #dc3545; font-size: 30px; text-align: center; margin-bottom: 10px;">
        ⚠️ Price Increase Alert!
      </h2>
      <p style="font-size: 18px; text-align: center; color: #555; margin-bottom: 25px;">
        Heads up! A product you're watching has increased in price.
      </p>
      
      <div style="background: #fff7f7; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px dashed #f5c6cb;">
        <p style="font-size: 18px; text-align: center; margin: 0 0 10px;">
          <strong style="color: #222;">${params.title ?? 'Product'}</strong><br/> 
          on <strong style="color: #007bff;">${params.platform}</strong>
        </p>
        
        <p style="font-size: 22px; text-align: center; margin: 12px 0; font-weight: bold;">
          🔺 Now at: <span style="color: #dc3545;">₹${params.currentPrice}</span>
        </p>
        <p style="font-size: 16px; text-align: center; margin: 5px 0; color: #888;">
          (Your max alert was: ₹${params.minPrice})
        </p>
      </div>

      ${
        params.imageUrl
          ? `
        <div style="text-align: center; margin: 25px 0;">
          <img src="${params.imageUrl}" alt="Product Image" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08);" />
        </div>
      `
          : ''
      }

      <div style="text-align: center; margin-top: 20px;">
        <a href="${params.url}" style="background: linear-gradient(45deg, #dc3545, #f78d8d); color: #ffffff; padding: 14px 30px; font-size: 17px; font-weight: bold; text-decoration: none; border-radius: 50px; display: inline-block; box-shadow: 0 4px 12px rgba(220,53,69,0.3); transition: all 0.3s;">
          👀 Check Product
        </a>
      </div>

      <div style="margin-top: 40px; font-size: 14px; text-align: center; color: #aaa; line-height: 1.5;">
        <p>⚠️ You’re receiving this email because you set a price alert for this product.</p>
        <p>If you no longer want to receive these notifications, you can <a href="#" style="color: #007bff; text-decoration: none;">unsubscribe here</a> ❌</p>
      </div>
    </div>
  </div>
`;

    if (params.messageType === 'PRICE_HIGH') {
      var html = html2;
      await this.transporter.sendMail({ from, to, subject, html });
    } else {
      var html = html1;
      await this.transporter.sendMail({ from, to, subject, html });
    }
  }
}

//ECQBC3M2B8CQK4GBNB6DCT9Q
