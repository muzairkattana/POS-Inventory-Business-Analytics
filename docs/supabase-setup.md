# Supabase Integration Setup Guide

## Prerequisites

You need to provide:
1. **Supabase Project URL** - From your Supabase dashboard
2. **Supabase Anon Key** - Public API key from your project settings
3. **Supabase Service Role Key** (optional) - For server-side operations

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Fill in:
   - **Project Name:** Noman Enterprises
   - **Database Password:** (choose a strong password)
   - **Region:** Select closest to your users
5. Wait for project to be created (~2 minutes)

## Step 2: Run SQL Schema

### Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- =====================================================
-- NOMAN ENTERPRISES DATABASE SCHEMA
-- Invoice Management System with Cloud Storage
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- 1. COMPANIES TABLE
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255),
    address TEXT,
    phone1 VARCHAR(50),
    phone2 VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. CLIENTS TABLE
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. INVOICES TABLE
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    client_address TEXT,
    client_city VARCHAR(100),
    
    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Financial
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_discount DECIMAL(12, 2) DEFAULT 0,
    total_tax DECIMAL(12, 2) DEFAULT 0,
    grand_total DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    pending_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partially_paid', 'cancelled')),
    
    -- Metadata
    notes TEXT,
    terms TEXT,
    sync_status VARCHAR(50) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'offline_only', 'conflict')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. INVOICE ITEMS TABLE
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL DEFAULT 0,
    
    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    
    -- Calculations
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    discount DECIMAL(5, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. TABLE COLUMNS CONFIGURATION
CREATE TABLE table_columns_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    column_name VARCHAR(100) NOT NULL,
    column_key VARCHAR(100) NOT NULL,
    column_type VARCHAR(50) NOT NULL,
    column_width VARCHAR(50),
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    column_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. ACTIVITY LOGS TABLE
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_type VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    user_name VARCHAR(255),
    user_agent TEXT,
    ip_address VARCHAR(50),
    
    -- Details
    details JSONB,
    reverse_data JSONB,
    
    -- Flags
    reversible BOOLEAN DEFAULT false,
    reversed BOOLEAN DEFAULT false,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. CAMERA CAPTURES TABLE (Security Photos)
CREATE TABLE camera_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('login', 'logout')),
    image_data TEXT NOT NULL, -- Base64 encoded
    device_info JSONB,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 8. USER SETTINGS TABLE
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_sync_status ON invoices(sync_status);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_order ON invoice_items(invoice_id, item_order);

CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_email ON clients(email);

CREATE INDEX idx_activity_logs_type ON activity_logs(log_type);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

CREATE INDEX idx_camera_captures_username ON camera_captures(username);
CREATE INDEX idx_camera_captures_event ON camera_captures(event_type);
CREATE INDEX idx_camera_captures_time ON camera_captures(captured_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate totals from items
    SELECT 
        COALESCE(SUM(quantity * unit_price), 0),
        COALESCE(SUM(quantity * unit_price * discount / 100), 0),
        COALESCE(SUM(quantity * unit_price * (1 - discount/100) * tax_rate / 100), 0)
    INTO NEW.subtotal, NEW.total_discount, NEW.total_tax
    FROM invoice_items
    WHERE invoice_id = NEW.id;
    
    -- Calculate grand total
    NEW.grand_total = NEW.subtotal - NEW.total_discount + NEW.total_tax;
    
    -- Calculate pending amount
    NEW.pending_amount = NEW.grand_total - COALESCE(NEW.paid_amount, 0);
    
    -- Update status based on payment
    IF NEW.paid_amount >= NEW.grand_total THEN
        NEW.status = 'paid';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.status = 'partially_paid';
    ELSIF NEW.due_date < CURRENT_DATE AND NEW.status = 'sent' THEN
        NEW.status = 'overdue';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate totals when items change
CREATE TRIGGER recalculate_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_columns_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies (Allow all for authenticated users - adjust based on your auth setup)
CREATE POLICY "Allow all for authenticated users" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON invoices FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON invoice_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON table_columns_config FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON camera_captures FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON user_settings FOR ALL USING (true);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Invoice Summary View
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.invoice_date,
    i.due_date,
    i.status,
    i.grand_total,
    i.paid_amount,
    i.pending_amount,
    c.name as client_name,
    c.email as client_email,
    co.name as company_name,
    COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN companies co ON i.company_id = co.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, c.name, c.email, co.name;

-- Monthly Revenue View
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    DATE_TRUNC('month', invoice_date) as month,
    COUNT(*) as invoice_count,
    SUM(grand_total) as total_revenue,
    SUM(paid_amount) as collected_amount,
    SUM(pending_amount) as pending_amount,
    AVG(grand_total) as avg_invoice_value
FROM invoices
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

-- =====================================================
-- SEED DATA (Optional - Default Company)
-- =====================================================

INSERT INTO companies (name, owner, address, phone1, email) VALUES
('Biocure Health Care', 'Mushtaq Ahmad', 'Sheikh Maltoon', '0345-5167742', 'biocurehealthcare1979@gmail.com');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- COMPLETED!
-- =====================================================
-- Your database is now ready for the Noman Enterprises app!
```

## Step 3: Get Your Credentials

After running the SQL:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (long string)
   - **service_role key:** `eyJhbGc...` (keep this secret!)

## Step 4: Update Environment Variables

Create `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - for server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 5: Test Connection

After setting up:
1. Restart your dev server: `npm run dev`
2. Login to the app
3. Create an invoice
4. Check Supabase dashboard → Table Editor → `invoices` table
5. You should see your invoice data!

## Features Enabled

✅ **Cloud Storage** - All data synced to Supabase
✅ **Offline Support** - Works offline, syncs when online
✅ **Real-time Sync** - Multiple devices stay in sync
✅ **Activity Logging** - All actions tracked
✅ **Security Photos** - Login/logout captures stored
✅ **Backup & Recovery** - Data safe in cloud
✅ **Multi-device** - Access from anywhere

## Database Structure

### Main Tables:
- **companies** - Your company information
- **clients** - Customer database
- **invoices** - Invoice headers
- **invoice_items** - Line items for each invoice
- **table_columns_config** - Custom table columns
- **activity_logs** - Audit trail
- **camera_captures** - Security photos
- **user_settings** - App preferences

### Views:
- **invoice_summary** - Quick overview of all invoices
- **monthly_revenue** - Revenue analytics by month

## Troubleshooting

### Connection Issues:
1. Check if `.env.local` exists and has correct values
2. Restart dev server after adding env variables
3. Check Supabase project is active (not paused)

### RLS Errors:
- If you get "row level security" errors, the policies might need adjustment
- For testing, you can disable RLS temporarily (not recommended for production)

### Sync Issues:
- Check browser console for errors
- Verify API keys are correct
- Check network tab to see API calls

## Next Steps

1. **Enable Authentication** - Set up Supabase Auth for user management
2. **Set up Storage** - Use Supabase Storage for file uploads (logos, signatures)
3. **Enable Real-time** - Subscribe to changes for live updates
4. **Add Backups** - Set up automated database backups
5. **Configure Security** - Adjust RLS policies for production

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Discord Support: https://discord.supabase.com
