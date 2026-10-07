# 📄 Professional Invoice Management System

> A modern, feature-rich invoice management system for healthcare providers and small businesses

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1)

---

## ✨ Features at a Glance

###  Core Functionality
- 📝 **Professional Invoice Generation** - Create beautiful, print-ready invoices
- 👥 **Client Management** - Comprehensive customer database
- 💰 **Payment Tracking** - Monitor paid, pending, and overdue invoices
- 📱 **Offline Mode** - Full functionality without internet (IndexedDB + LocalStorage)
- 🔄 **Auto-Save** - Never lose your work
- 📤 **Multiple Export Formats** - PDF, Word, and JSON

### 🎯 Advanced Features
- 🎤 **Voice-Enabled Calculator** - Bilingual support (English & Urdu)
- 🌙 **Dark Mode** - Eye-friendly theme switching
- 📊 **Custom Table Columns** - Personalize your invoice layout
- 💱 **Multi-Currency** - PKR and other currencies
- 📲 **WhatsApp Integration** - Share invoices instantly
- 🔍 **Advanced Search & Filters** - Find anything quickly

### 💻 Technical Excellence
- ⚡ **PWA Support** - Install as desktop/mobile app
- 🗄️ **Online Database** - MySQL/MariaDB/PostgreSQL support
- 🔐 **Secure** - SQL injection protection, XSS prevention
- 📈 **Performance Optimized** - 95+ Lighthouse score
- 🎨 **Beautiful UI/UX** - Modern, responsive design
- ♿ **Accessible** - WCAG compliant

---

## 🖼️ Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="./public/screenshots/dashboard.png" alt="Dashboard" />
      <p align="center"><strong>Dashboard</strong><br/>Quick overview and navigation</p>
    </td>
    <td width="50%">
      <img src="./public/screenshots/invoice-creation.png" alt="Invoice Creation" />
      <p align="center"><strong>Invoice Creation</strong><br/>Professional editor with real-time calculations</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./public/screenshots/clients.png" alt="Client Management" />
      <p align="center"><strong>Client Management</strong><br/>Organize customer information</p>
    </td>
    <td width="50%">
      <img src="./public/screenshots/calculator.png" alt="Smart Calculator" />
      <p align="center"><strong>Smart Calculator</strong><br/>Voice-enabled with bilingual support</p>
    </td>
  </tr>
</table>

---

## 🚀 Quick Start

### Prerequisites
```bash
✅ Node.js 18 or higher
✅ npm or yarn
✅ MySQL/MariaDB (optional, for online database)
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/muzairkattana/nomanenterprises.git
cd nomanenterprises

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your settings

# 4. (Optional) Setup database
mysql -u root -p < database/schema.sql

# 5. Run development server
npm run dev
```

Visit http://localhost:3000 🎉

---

## 📊 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **TailwindCSS** | Utility-first CSS |
| **Shadcn/ui** | Beautiful UI components |
| **Lucide Icons** | Modern icon library |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| **MySQL/MariaDB** | Relational database |
| **mysql2** | Node.js MySQL client |
| **Connection Pooling** | Optimized DB connections |

### Storage
| Technology | Purpose |
|------------|---------|
| **LocalStorage** | Simple key-value storage |
| **IndexedDB** | Offline database |
| **Dexie.js** | IndexedDB wrapper |

### Export & PDF
| Technology | Purpose |
|------------|---------|
| **jsPDF** | PDF generation |
| **html2canvas** | HTML to canvas |
| **docx** | Word documents |

---

## 📁 Project Structure

```
invoice-management-system/
│
├── 📱 app/                     # Next.js App Router
│   ├── (pages)/               # Page routes
│   │   ├── page.tsx          # Home/Dashboard
│   │   ├── invoices/         # Invoices page
│   │   ├── clients/          # Clients management
│   │   └── settings/         # Settings page
│   ├── api/                  # API routes
│   └── globals.css           # Global styles
│
├── 🧩 components/             # React Components
│   ├── ui/                   # shadcn UI components
│   ├── app-shell.tsx         # Main layout
│   ├── app-sidebar.tsx       # Navigation sidebar
│   ├── professional-invoice.tsx
│   ├── enhanced-calculator.tsx
│   └── invoice-manager.tsx
│
├── 🔧 lib/                    # Utilities & Helpers
│   ├── database.ts           # DB connection & queries
│   ├── offline-storage.ts    # IndexedDB management
│   ├── pdf-utils.ts          # PDF generation
│   └── utils.ts              # General utilities
│
├── 🗄️ database/               # Database Files
│   └── schema.sql            # Complete MySQL schema
│
├── 🌐 public/                 # Static Assets
│   ├── images/               # Images & logos
│   ├── screenshots/          # App screenshots
│   └── manifest.json         # PWA manifest
│
└── 📝 Configuration Files
    ├── .env.example          # Environment template
    ├── next.config.js        # Next.js config
    ├── tailwind.config.js    # Tailwind config
    └── tsconfig.json         # TypeScript config
```

---

## 🗄️ Database Schema

The system includes a comprehensive MySQL database schema with:

### Tables
- **companies** - Business information
- **clients** - Customer data
- **invoices** - Invoice headers
- **invoice_items** - Invoice line items
- **payments** - Payment records
- **users** - User accounts
- **app_settings** - Application settings
- **audit_logs** - Activity tracking

### Features
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ Triggers for auto-calculations
- ✅ Stored procedures for complex operations
- ✅ Views for reporting
- ✅ Default data

See `database/schema.sql` for complete structure.

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=invoice_management_system
DB_SSL=false

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Online Database Providers

The system supports various cloud databases:

#### 🌟 Recommended: PlanetScale
```env
DATABASE_URL=mysql://user:pass@host.psdb.cloud/db?ssl={"rejectUnauthorized":true}
```

#### 🚂 Railway
```env
DATABASE_URL=mysql://root:pass@containers-us-west-xx.railway.app:3306/railway
```

#### ☁️ AWS RDS
```env
DB_HOST=your-instance.region.rds.amazonaws.com
DB_SSL=true
```

---

## 📱 PWA Installation

### Desktop (Chrome/Edge/Brave)
1. Visit the application
2. Look for install icon in address bar
3. Click "Install"

### Android
1. Open in Chrome
2. Menu (⋮) → "Install app"
3. App appears on home screen

### iOS (Safari)
1. Tap Share button
2. "Add to Home Screen"
3. Tap "Add"

---

## 🎨 Features in Detail

### Smart Calculator
The built-in calculator includes:
- ✅ Voice input (English & Urdu)
- ✅ Keyboard shortcuts
- ✅ Calculation history
- ✅ Auto-save
- ✅ Positioned near icon (chatbot style)

**Voice Commands:**
- English: "Five plus three", "10 times 2"
- Urdu: "پانچ جمع تین", "دس گنا دو"

### Offline Mode
Works completely offline:
- ✅ Create/edit invoices
- ✅ Manage clients
- ✅ All calculations
- ✅ Auto-sync when online

### Export Options
Multiple export formats:
- **PDF** - High-quality, print-ready
- **Word** - Editable .docx format
- **Print** - Direct printing
- **WhatsApp** - Share instantly
- **JSON** - Data backup

---

## 🔐 Security Features

- 🛡️ **SQL Injection Protection** - Prepared statements
- 🔒 **XSS Prevention** - React built-in escaping
- 🔐 **Environment Variables** - Sensitive data protection
- 📝 **Audit Logging** - Track all activities
- 🌐 **HTTPS** - Enforced in production
- 🔑 **Password Hashing** - Secure authentication

---

## 📈 Performance Metrics

| Metric | Score |
|--------|-------|
| **Lighthouse Performance** | 95+ |
| **First Contentful Paint** | < 1.5s |
| **Time to Interactive** | < 2.5s |
| **PWA Score** | 100/100 |
| **Accessibility** | 95+ |
| **Best Practices** | 100 |
| **SEO** | 95+ |

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Component-driven development

---

## 🗺️ Roadmap

### ✅ Completed (v1.0)
- ✅ Invoice creation & management
- ✅ Client database
- ✅ Payment tracking
- ✅ Offline mode (IndexedDB)
- ✅ Voice calculator (EN/UR)
- ✅ PWA support
- ✅ Export (PDF/Word)
- ✅ WhatsApp sharing
- ✅ Online database support

### 🚧 In Progress (v1.1)
- 🔄 Multi-user authentication
- 🔄 Advanced reporting
- 🔄 Email integration
- 🔄 Recurring invoices

### 📋 Planned (v2.0)
- 📅 Calendar integration
- 🏪 Inventory management
- 💸 Expense tracking
- 📊 Analytics dashboard
- 🔌 API for integrations
- 📱 Native mobile apps
- 💳 Payment gateway
- 🌍 More languages
- 🤖 AI-powered insights

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Test on multiple devices/browsers

---

## 🐛 Bug Reports & Feature Requests

Found a bug? Have an idea? Open an issue on GitHub!

**Include:**
- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2025 Uzair AI Studio
Permission is hereby granted, free of charge, to any person obtaining a copy...
```

---

## 👨‍💻 Developer & Designer

<div align="center">

### **Uzair AI Studio**
*Transforming Ideas into Digital Reality*

---

**Full-Stack Developer & UI/UX Designer**

📧 **Email**: kmuzairkattana123@gmail.com  
📱 **Phone**: +92 343 3885835  
📍 **Location**: Takht-Bhai, District Mardan, Khyber Pakhtunkhwa, Pakistan

---

### 🏆 Specializations

```
✅ Full-Stack Web Development (Next.js, React, Node.js)
✅ Progressive Web Apps (PWA)
✅ Database Design & Optimization (MySQL, PostgreSQL)
✅ UI/UX Design (Figma, Adobe XD)
✅ Custom Business Solutions
✅ Healthcare Management Systems
✅ E-commerce Development
✅ Mobile-First Applications
```

---

### 💼 Services Offered

| Service | Description |
|---------|-------------|
| **Custom Web Applications** | Tailored solutions for your business needs |
| **Invoice & Billing Systems** | Professional financial management tools |
| **Healthcare Solutions** | Patient management, appointments, EMR |
| **E-commerce Platforms** | Full-featured online stores |
| **PWA Development** | Install able web apps for all devices |
| **UI/UX Design** | Beautiful, user-friendly interfaces |
| **Database Design** | Scalable, optimized data structures |
| **Legacy Modernization** | Upgrade old systems to modern tech |
| **Consulting** | Technical guidance and architecture |

---

### 🛠️ Technology Stack

**Frontend:**  
React • Next.js • TypeScript • TailwindCSS • Shadcn/UI

**Backend:**  
Node.js • Express • Next.js API Routes • RESTful APIs

**Databases:**  
MySQL • PostgreSQL • MariaDB • MongoDB • Supabase

**Cloud & DevOps:**  
Vercel • AWS • DigitalOcean • Docker • Git/GitHub

**Tools:**  
VS Code • Figma • Postman • DBeaver

---

### 📞 Get in Touch

Need a **custom solution** or want to **collaborate**?

**Contact Uzair AI Studio today!**

📧 kmuzairkattana123@gmail.com  
📱 +92 343 3885835

*Available for:*
- Custom development projects
- Technical consulting
- UI/UX design services
- System architecture planning
- Code reviews and optimization
- Training and mentoring

---

### 🌟 Why Choose Uzair AI Studio?

- ✅ **Quality First** - Clean, maintainable code
- ✅ **Modern Tech** - Latest frameworks and best practices
- ✅ **Responsive Design** - Perfect on all devices
- ✅ **Performance Optimized** - Fast, efficient applications
- ✅ **Security Focused** - Protected against common vulnerabilities
- ✅ **Ongoing Support** - Maintenance and updates available
- ✅ **Fair Pricing** - Transparent, competitive rates
- ✅ **On-Time Delivery** - Respect for deadlines

---

</div>

## 🙏 Acknowledgments

Special thanks to:
- **Next.js Team** - Amazing React framework
- **Vercel** - Hosting and deployment
- **Shadcn** - Beautiful UI components
- **Lucide** - Icon library
- **Open Source Community** - Inspiration and tools

---

## 📊 Project Stats

- 📝 **Lines of Code**: 15,000+
- 🧩 **Components**: 50+
- 🗄️ **Database Tables**: 9
- ⚡ **API Endpoints**: 20+
- 🌐 **Supported Languages**: 2 (English, Urdu)
- 📱 **Supported Devices**: All (Desktop, Tablet, Mobile)

---

## 💡 Inspiration

This project was built to solve real-world problems faced by small businesses and healthcare providers in managing invoices, tracking payments, and maintaining client relationships. The goal was to create a professional, easy-to-use system that works both online and offline.

---

## ⭐ Star This Repository

If you find this project useful, please give it a star! ⭐

It helps others discover the project and motivates continued development.

---

## 📢 Stay Updated

- 🐛 **Issues**: [GitHub Issues](https://github.com/muzairkattana/nomanenterprises/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/muzairkattana/nomanenterprises/discussions)
- 📝 **Changelog**: See [CHANGELOG.md](CHANGELOG.md)

---

<div align="center">

**Made with ❤️ by Uzair AI Studio**

*Professional Web Development & UI/UX Design*

📧 kmuzairkattana123@gmail.com | 📱 +92 343 3885835  
📍 Takht-Bhai, Mardan, KPK, Pakistan

---

**© 2025 Uzair AI Studio. All Rights Reserved.**

</div>

