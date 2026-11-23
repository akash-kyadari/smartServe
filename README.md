# smartServe — QR-Based Restaurant Management System

A modern, full-stack restaurant management platform that streamlines operations through QR code ordering, real-time kitchen coordination, inventory tracking, and business analytics — all in one seamless experience.

---

## ✨ Features

### 🍽️ For Customers
- **QR Code Ordering** — Scan table QR codes to browse menu, customize orders, and pay
- **Real-time Order Tracking** — Live status updates from kitchen to table
- **Split Bills & Tips** — Easy payment splitting with multiple methods
- **Dietary Filters** — Allergen, vegetarian, vegan, gluten-free tags

### 👨‍🍳 For Staff
- **Kitchen Display System (KDS)** — Real-time order queue with priority sorting
- **Table Management** — Visual floor plan with occupancy/status
- **Inventory Alerts** — Low-stock notifications and auto-reorder suggestions
- **Shift & Role Management** — Waitstaff, kitchen, manager dashboards

### 📊 For Owners/Managers
- **Analytics Dashboard** — Revenue, peak hours, popular items, table turnover
- **Menu Engineering** — Item profitability analysis with cost/margin tracking
- **Staff Performance** — Orders/server, tips, efficiency metrics
- **Multi-location Support** — Centralized management for chains

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Zustand |
| **Backend** | Node.js, Express 5, MongoDB + Mongoose 9 |
| **Real-time** | Socket.IO (orders, KDS, table status) |
| **Auth** | JWT, bcryptjs, Passport.js (Google OAuth), HttpOnly cookies |
| **Security** | Helmet, CORS, Rate Limiting, Mongo Sanitize, express-validator |
| **Performance** | Compression, Cookie Parser, Date-fns |
| **UI Components** | Lucide React, React Hot Toast, clsx, tailwind-merge |
| **QR Codes** | qrcode.react |
| **Deployment** | Netlify (frontend), Cloud/VM (backend) |

---

## 📁 Project Structure

```
smartServe/
├── frontend/                 # Next.js 16 App Router
│   ├── src/
│   │   ├── app/              # Pages & layouts
│   │   │   ├── (auth)/       # Login, register, OAuth
│   │   │   ├── (dashboard)/  # Owner/staff dashboards
│   │   │   ├── (customer)/   # Menu, ordering, tracking
│   │   │   └── (kds)/        # Kitchen Display System
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities, API client, auth
│   │   └── store/            # Zustand state management
│   ├── public/               # Static assets
│   └── ...
├── backend/                  # Express API
│   ├── src/
│   │   ├── config/           # DB, env, passport config
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helpers, constants
│   │   └── app.js            # Express app entry
│   └── ...
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
- Google Cloud Console project (OAuth)
- SSL certificates for production (QR codes require HTTPS)

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << 'EOF'
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smartserve

# Auth
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

npm run dev
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EOF

npm run dev
# App runs on http://localhost:3000
```

---

## 📡 API Endpoints

| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/google`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| **Menu** | `GET /api/menu`, `POST /api/menu`, `PATCH /api/menu/:id`, `DELETE /api/menu/:id`, `GET /api/menu/categories` |
| **Orders** | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`, `GET /api/orders/table/:tableId` |
| **Tables** | `GET /api/tables`, `POST /api/tables`, `PATCH /api/tables/:id`, `GET /api/tables/qr/:tableId` |
| **Inventory** | `GET /api/inventory`, `POST /api/inventory`, `PATCH /api/inventory/:id`, `GET /api/inventory/low-stock` |
| **Analytics** | `GET /api/analytics/revenue`, `GET /api/analytics/popular-items`, `GET /api/analytics/peak-hours`, `GET /api/analytics/staff-performance` |
| **Staff** | `GET /api/staff`, `POST /api/staff`, `PATCH /api/staff/:id`, `GET /api/staff/shifts` |

---

## 🔐 Security Features

- **Helmet.js** — HTTP headers hardening
- **Rate Limiting** — Express-rate-limit on auth & API routes
- **Mongo Sanitize** — Prevents NoSQL injection
- **Input Validation** — express-validator on all mutations
- **CORS** — Configured for specific frontend origin
- **JWT** — Short-lived access tokens, HttpOnly refresh cookies
- **Password Hashing** — bcryptjs with salt rounds 12

---

## 🎯 Roadmap

- [ ] **Multi-tenant** — White-label for restaurant chains
- [ ] **Payment Integration** — Stripe/Razorpay for online payments
- [ ] **Kitchen Printer Support** — ESC/POS thermal printer integration
- [ ] **Customer Loyalty** — Points, rewards, visit tracking
- [ ] **Advanced Analytics** — Predictive ordering, waste reduction
- [ ] **Mobile Apps** — React Native for staff/customer apps
- [ ] **Tests** — Unit (Jest), Integration (Supertest), E2E (Playwright)

---

## 📄 License

MIT License — free for personal and commercial use.

---

## 👨‍💻 Author

**Dinesh Reddy Pothula**  
Full Stack Developer • Data Analytics • Problem Solver  

[GitHub](https://github.com/dineshreddypothula) • [LinkedIn](https://www.linkedin.com/in/dinesh-reddy-pothula/) • [Email](mailto:dineshreddypothula@gmail.com)