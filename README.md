# Billie 🧾✨

> **Smart Voice & Text Invoice Assistant — Progressive Web App (PWA)**

Billie is a minimalist, responsive Material Design 3 Progressive Web App (PWA) designed for instant invoice generation, subtotal calculation, and offline PDF billing using either natural speech or quick text commands.

---

## ✨ Features

- 🎙️ **Voice & Text Central Search Bar**: 
  - Positioned at the center bottom for comfortable mobile and desktop operation.
  - Powered by Web Speech API (`SpeechRecognition`) with animated soundwaves and speech listening cues.
  - Natural speech & text input: Simply say or type `"generate invoice"`.
- ⚡ **Interactive Conversational Flow**:
  - Prompted field-by-field guidance:
    1. **Customer Name** (e.g. *"Acme Corp"*)
    2. **Product / Service** (e.g. *"Cloud Architecture Consulting"*)
    3. **Quantity** (e.g. *"2"*)
    4. **Price per unit** (e.g. *"$1200"*)
    5. **Discount** (percentage e.g. *"10%"* or flat amount)
  - Also supports one-shot speech input:
    `"Generate invoice for Acme Corp, 2 Laptops at 1200 with 10% discount"`
- 🧮 **Instant Calculation & Breakdown**:
  - Automatic calculation of subtotal: `Quantity × Price`.
  - Discount calculation: Percent or flat rate deductions.
  - Configurable Tax / VAT / GST rates.
  - Clear Grand Total summary.
- 📥 **100% Offline Client-Side PDF Generation**:
  - Built with `jsPDF` and `jspdf-autotable`.
  - Generates crisp, branded A4 invoices instantly without external servers.
  - Direct download and browser print preview options.
- 📲 **Progressive Web App (PWA) & Offline Mode**:
  - Web App Manifest (`manifest.webmanifest`) with multi-resolution maskable and vector icons.
  - Custom Service Worker caching the App Shell and assets for full offline functionality.
  - In-profile **Download PWA / Install Offline App** trigger.
- 👤 **Business Profile & Authentication**:
  - Material 3 login page / modal with 1-click Demo credentials.
  - Customizable business details (Company Name, Owner Name, Address, Phone, Email, Tax ID/VAT).
  - Prominent **Logout** button.
- ⚙️ **Settings & Invoice History**:
  - Multi-currency support (USD `$`, INR `₹`, EUR `€`, GBP `£`, CAD `CA$`, AUD `AU$`, JPY `¥`, AED `AED`).
  - Invoice prefix configuration (`INV-2026-`).
  - Web Speech synthesis (TTS) toggle so Billie can speak responses back aloud.
  - Stored invoice history with instant PDF re-download.

---

## 🎨 Material Design 3 Aesthetics

- Minimalist aesthetic inspired by modern Google AI interfaces.
- Floating pill-shaped search bar with elevation shadows and backdrop blur.
- Material 3 tonal color palettes, rounded dialog sheets (`28px`), and accessible high-contrast text.
- Full Light and Dark theme modes.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd billie-pwa

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build

```bash
# Build production bundle with optimized PWA assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📦 PWA Offline Installation Guide

1. **Desktop (Chrome / Edge / Brave)**:
   - Click the **Install** icon (⊕) located in the address bar, or open your **Profile** in Billie and click **"Download PWA (Install Offline App)"**.
2. **Mobile (Android Chrome)**:
   - Tap the install prompt banner or tap the three dots menu `⋮` and select **"Add to Home screen"** / **"Install App"**.
3. **Mobile (iOS Safari)**:
   - Tap the **Share** button at the bottom of Safari, then select **"Add to Home Screen"**.

Once installed, Billie launches in a full standalone window and works without an active internet connection.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Voice APIs**: Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **PWA**: Custom Service Worker + Web App Manifest v3

---

## 📄 License

MIT License. Designed with ❤️ for effortless invoicing.
