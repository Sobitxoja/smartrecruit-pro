import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// In-memory store for verification codes (Email -> {code, timestamp})
const verificationCodes = new Map<string, { code: string; timestamp: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email, { code, timestamp: Date.now() });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Email simulated.');
    return res.json({
      success: true,
      message: 'Verification code simulated (RESEND_API_KEY missing)',
      code: code
    });
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: 'sobit.ortiqxojaev@gmail.com',
      to: email,
      subject: 'Verification Code: ' + code,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Verify your email</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">Your verification code for SmartRecruit is:</p>
          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    res.json({ success: true, message: 'Verification code sent via Resend' });
  } catch (error: any) {
    console.error('Resend error:', error);
    res.status(500).json({ error: 'Failed to send email via Resend', details: error.message });
  }
}
