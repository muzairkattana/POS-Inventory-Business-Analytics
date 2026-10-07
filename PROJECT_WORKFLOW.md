# 🏥 BioCure Healthcare — System Architecture & Workflow Guide

A complete, easy-to-understand developer guide outlining the entire BioCure Healthcare system architecture, core feature workflows, data structures, and step-by-step Mermaid diagrams.

---

## ⚡ Executive Summary & Tech Stack

BioCure Healthcare is an enterprise-grade medical and business management software providing **Invoice Generation**, **Wholesale Product Inventory**, **Expense Tracking**, **Client Directories**, and **Real-Time Financial Reports**.

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS v4, Lucide Icons
- **State & Theme**: Custom `ThemeProvider` with localStorage persistence and OKLCH Twilight Slate dark mode
- **Data Layer**: LocalStorage (instant offline availability) with fire-and-forget Supabase Cloud synchronization
- **Reports Engine**: Recharts for daily/weekly/monthly/yearly revenue, expenses, and net profit visualization

---

## 🏗️ High-Level System Architecture Diagram

```mermaid
graph TD
    User["👤 User / Administrator"] --> AppRouter["🚀 Next.js App Router (app/)"]
    
    AppRouter --> PageInvoice["📄 Invoices Dashboard (/)"]
    AppRouter --> PageProducts["📦 Wholesale Products (/products)"]
    AppRouter --> PageExpenses["💸 Expenses Ledger (/expenses)"]
    AppRouter --> PageReports["📊 Business Reports (/reports)"]
    AppRouter --> PageClients["👥 Clients Directory (/clients)"]
    AppRouter --> PageSettings["⚙️ Settings & Theme (/settings)"]

    PageInvoice & PageProducts & PageExpenses & PageClients & PageReports --> StorageEngine["💾 LocalStorage Storage Engine"]
    StorageEngine --> CloudSync["☁️ Supabase Cloud Sync (lib/supabase-service.ts)"]
```

---

## 🔄 Feature Workflows & Step-by-Step Diagrams

### 1. Invoice Generation & Billing Workflow
**Overview**: Create, print, save, duplicate, or share medical invoices via WhatsApp with automatic tax, discount, and grand total calculations.

```mermaid
flowchart TD
    A["Start New Invoice"] --> B["Select Client & Date"]
    B --> C["Add Items / Wholesale Products"]
    C --> D["Apply Discounts & Taxes"]
    D --> E{"Action Selected"}
    E -->|"Save Invoice"| F["Store in LocalStorage & Supabase"]
    E -->|"Print"| G["Trigger Browser Print Dialog"]
    E -->|"WhatsApp"| H["Generate WhatsApp Direct Message Link"]
    E -->|"PDF Export"| I["Render PDF Document"]
    F --> J["Update Reports Analytics"]
```

---

### 2. Wholesale Products & Stock Management
**Overview**: Manage medicine inventory, stock quantities, trade prices, retail prices, and low-stock alerts.

```mermaid
flowchart TD
    A["Navigate to Wholesale Products (/products)"] --> B["Search or Filter Products"]
    B --> C{"Select Action"}
    C -->|"Add Product"| D["Open Add Product Modal -> Save to Catalog"]
    C -->|"Edit Stock"| E["Update Product Quantity / Prices"]
    C -->|"Direct Bill"| F["Add Item Directly to Active Invoice Draft"]
    D & E --> G["Persist in LocalStorage ('wholesale_products')"]
```

---

### 3. Expenses Ledger & Expense Tracking
**Overview**: Log business purchases (COGS), salaries, office/shop rent, utility bills, and maintenance to determine net operating expenses.

```mermaid
flowchart TD
    A["Navigate to Expenses (/expenses)"] --> B["View Expense KPI Cards & Table"]
    B --> C{"User Action"}
    C -->|"Add Expense"| D["Enter Title, Category, Amount, Date & Payment Method"]
    C -->|"Filter Category"| E["Filter by COGS, Salaries, Rent, Utilities, etc."]
    D --> F["Save via ExpenseStorage ('biocure_business_expenses')"]
    F --> G["Sync with Business Analytics Hub"]
```

---

### 4. Business Reports & Financial Analytics
**Overview**: Analyze business health through daily, weekly, monthly, and yearly revenue vs. expense charts to calculate **Net Profit** and **Profit Margin %**.

```mermaid
flowchart TD
    A["Open Reports Page (/reports)"] --> B["Load Invoices & Expenses Data"]
    B --> C["Calculate Gross Revenue (Paid + Unpaid)"]
    B --> D["Calculate Total Operating Expenses"]
    C & D --> E["Compute Net Profit = Revenue - Expenses"]
    E --> F["Compute Profit Margin % = (Net Profit / Revenue) * 100"]
    F --> G["Render Recharts (Daily, Weekly, Monthly MoM, Yearly YoY)"]
```

---

### 5. Client Directory Management
**Overview**: Maintain client contact details, business names, addresses, tax IDs, and transaction histories.

```mermaid
flowchart TD
    A["Open Clients Page (/clients)"] --> B["View Client Cards & Search Bar"]
    B --> C{"Action"}
    C -->|"Add Client"| D["Open Client Form -> Save Client Profile"]
    C -->|"Edit Details"| E["Update Contact / Tax Information"]
    C -->|"View Details"| F["Display Full Profile & Invoice History"]
    D & E --> G["Persist in LocalStorage ('clients')"]
```

---

### 6. Theme Engine & Dark Mode Toggle
**Overview**: Dynamic theme switching between Light mode and a comfortable Twilight Slate dark theme (`#1e293b`).

```mermaid
flowchart TD
    A["User Clicks Theme Toggle Button (Sun/Moon)"] --> B["ThemeProvider Reads Current Mode"]
    B --> C{"Current Theme"}
    C -->|"Light"| D["Apply 'dark' Class to <html> Element"]
    C -->|"Dark"| E["Remove 'dark' Class from <html> Element"]
    D & E --> F["Persist Selection in LocalStorage ('invoice-theme')"]
```

---

## 🚀 Quick Start for Developers

```bash
# 1. Clone Repository
git clone d:/biocurehealthcare

# 2. Install Dependencies
npm install

# 3. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start developing!
