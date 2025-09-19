import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";   // ✅ import path
import { fileURLToPath } from "url"; // ✅ import fileURLToPath

dotenv.config();
const app = express();

// ✅ Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Serve static files from public/
app.use(express.static(path.join(process.cwd(), "public")));

// ✅ Serve index.html from src/
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// WhatsApp API route
app.post("/send-whatsapp", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const url = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: process.env.BUSINESS_NUMBER,
        type: "text",
        text: { body: message }
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Email API route
app.post("/send-email", async (req, res) => {
  try {
    const { name, email, phone, destination, dates, travelers, accommodation, budget, message } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Travel Inquiry",
      text: `${message ? `${message}\n\n` : ''}Regards,\nBSA Air Travels Bot`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
