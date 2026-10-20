# 🇨🇳 China Supplier Directory

A production-grade, responsive SaaS web application designed for managing, organizing, and sourcing from verified China manufacturers and suppliers.

![China Supplier Directory](https://raw.githubusercontent.com/Shakhwat-93/supplier/main/public/preview.png)

---

## ⚡ Features

- **21 Verified Master Suppliers:** Complete contact records, Chinese company names, product catalogs, and verified business-card scans.
- **Cloudflare R2 Object Storage:** High-definition original business-card artwork hosted on Cloudflare R2 (`supplier-directory/` namespace) with pre-signed URL security.
- **Supabase Cloud Database:** Isolated `csd_suppliers`, `csd_supplier_assets`, and `csd_categories` tables with Row Level Security (RLS).
- **Decoded QR Code Intelligence:** Integrated WeChat and WhatsApp QR code decoding with instant contact launch.
- **Responsive Elite UI:**
  - Swipeable KPI ribbon on mobile (56px compact profile).
  - High-definition Card Inspector modal with zoom and dual-side inspection.
  - Independent drawer for contact metadata and product tags.
  - Multi-criteria real-time search (by code, company, person, product, city, or WeChat ID).

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **Database:** Self-Hosted Supabase / PostgreSQL
- **Storage:** Cloudflare R2 Object Storage (S3-compatible)
- **Deployment:** Vercel (SPA Rewrites + Serverless Upload API)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Shakhwat-93/supplier.git
cd supplier
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=http://your-supabase-url.example.com
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side Keys (Never committed to Git)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2 Object Storage
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=china-supplier-directory
R2_PREFIX=supplier-directory/
```

### 4. Run development server
```bash
pnpm run dev
```

### 5. Build for production
```bash
pnpm run build
```

---

## ☁️ Vercel Deployment

1. Import this repository into [Vercel](https://vercel.com).
2. Set the build command to `pnpm run build` and output directory to `dist`.
3. Add the following **Environment Variables** in Vercel Project Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PREFIX`
4. Deploy!

---

## 📄 License

MIT © [Shakhwat-93](https://github.com/Shakhwat-93)
