import { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const stored = verificationCodes.get(email);
  if (!stored) {
    return res.status(400).json({ error: 'No code sent to this email' });
  }

  // 10 minute expiry
  if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
    verificationCodes.delete(email);
    return res.status(400).json({ error: 'Code expired' });
  }

  if (stored.code === code) {
    verificationCodes.delete(email);
    return res.json({ success: true });
  } else {
    return res.status(400).json({ error: 'Invalid verification code' });
  }
}
