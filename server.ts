
import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for verification codes (Email -> {code, timestamp})
const verificationCodes = new Map<string, { code: string; timestamp: number }>();

// Lazy initialization for Resend
let resendClient: Resend | null = null;
const getResend = () => {
  if (!resendClient) {
    // support either plain RESEND_API_KEY (server) or VITE_RESEND_API_KEY (shared env for dev)
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not set. Emails will be simulated.");
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

// API Routes
// API Routes
app.get("/api/verify/status", (req, res) => {
    // Check whichever key is available (server or VITE prefixed)
    const hasValidKey = !!(process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY);
    res.json({
        configured: hasValidKey,
        mode: hasValidKey ? "production" : "simulation"
    });
});

app.post("/api/verify/send", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email, { code, timestamp: Date.now() });

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Verification Code: " + code,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #1e293b; margin-bottom: 16px;">Verify your email</h2>
            <p style="color: #475569; font-size: 16px; line-height: 24px;">Your verification code for SmartRecruit is:</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      res.json({ success: true, message: "Verification code sent via Resend" });
    } catch (error: any) {
      console.error("Resend error:", error);
      res.status(500).json({ error: "Failed to send email via Resend", details: error.message });
    }
  } else {
    // Simulation mode
    console.log(`[SIMULATION] Verification code for ${email}: ${code}`);
    res.json({ 
      success: true, 
      message: "Verification code simulated (RESEND_API_KEY missing)", 
      code: code // Return code in simulation mode for easier testing
    });
  }
});

app.post("/api/verify/check", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

  const stored = verificationCodes.get(email);
  if (!stored) return res.status(400).json({ error: "No code sent to this email" });

  // 10 minute expiry
  if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
    verificationCodes.delete(email);
    return res.status(400).json({ error: "Code expired" });
  }

  if (stored.code === code) {
    verificationCodes.delete(email);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid verification code" });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
