# 🚀 Multi-Tenant E-Commerce Marketplace System

A high-conversion quick commerce platform engineered for ultra-fast, mobile-optimized standalone inventory sales. This framework allows individual merchants (tenants) to host premium, high-urgency single-product storefronts that route checkouts directly into WhatsApp conversational threads.

Built with **TanStack Start (React 19 + Vite)** for flawless Server-Side Rendering (SSR) to maximize Google Search indexing, paired with **Supabase Realtime Presence** to drive immediate buyer scarcity.

---

## ✨ Core Features

* **📦 Centralized Marketplace Hub (`/`):** Dynamic homepage featuring a horizontal rolling marquee showcasing trending products, robust search inputs, and dynamic category pill filters for effortless product discovery.
* **🔒 Gated Merchant Access (`/seller-login`):** Hand-provisioned backend shop access for premium subscribers. Public onboarding forms are removed. New sellers can trigger direct mail or structured WhatsApp registrations to request access from the platform administration team.
* **🔥 Real-Time Presence Counter:** Driven by **Supabase Presence**, the platform monitors active browser socket rooms per product to display live visitor counts (*"🔥 5 people are looking at this item right now!"*) without hitting database read/write limits.
* **📈 Scarcity Landing Funnels (`/$shopSlug/$productSlug`):** Single-product showcases featuring automatic layout asset adjustments (swiping carousel structures for multi-image listings), dynamic time countdown campaign clocks, and trust banners.
* **💬 Conversational WhatsApp Checkout:** A persistent, high-conversion baseline CTA tray that processes localized details, auto-compiles a pre-formatted purchase intent string, and triggers a direct handshake to the merchant's WhatsApp interface.
* **🔍 Built-In Search Engine Optimization (SEO):** Fully server-side rendered (SSR) architecture supporting a dynamic, automated `/sitemap.xml` indexer mapping all active inventory paths straight to Google Crawlers for native search visibility alongside industry giants.
* **🛡️ Enterprise-Grade Security:** Merchant credential safeguarding using backend **Bcrypt cryptographic hashing arrays** and secure signed sessions built directly into the authentication sequence.
* **📱 Sandbox-Resilient Mobile Layout:** Utility-first single-column structure (`max-w-md`) optimized explicitly to prevent aspect-ratio blowing inside restricted mobile viewports like Instagram, TikTok, or WhatsApp in-app browsers.

---

## 🛠️ Tech Stack & Ecosystem

* **Framework:** TanStack Start (Full-Stack React 19 + Vite Framework)
* **Database & Realtime Layer:** Supabase (PostgreSQL)
* **Styling Engine:** Tailwind CSS + shadcn/ui
* **Icon Library:** Lucide React
* **Language Variant:** TypeScript (Strict asynchronous typing models)

---

## 📋 Environment Configuration

Create a `.env` file in the root directory of your project and configure the following parameters:

```env
# Supabase Configuration Connections
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_key

# Marketing & Traffic Analytics Trackers
VITE_META_PIXEL_ID=your_meta_pixel_id
VITE_GOOGLE_ANALYTICS_ID=your_google_analytics_tracking_id
