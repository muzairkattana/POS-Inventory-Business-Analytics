-- ============================================
-- Invoice Management System - Database Schema
-- ============================================
-- Purpose: Complete database structure for managing invoices, clients, payments, and settings
-- This schema supports online database connectivity for production deployment
-- ============================================

-- Create database (if using MySQL/MariaDB)
CREATE DATABASE IF NOT EXISTS invoice_management_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE invoice_management_system;

-- ============================================
-- TABLE: companies
-- Purpose: Store company/business information
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255),
    address TEXT,
    phone1 VARCHAR(20),
    phone2 VARCHAR(20),
    email VARCHAR(255),
    ntn VARCHAR(50),
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: clients
-- Purpose: Store client/customer information
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Pakistan',
    tax_id VARCHAR(50),
    notes TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: invoices
-- Purpose: Store invoice header information
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client_id INT NOT NULL,
    company_id INT DEFAULT 1,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    subtotal DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    tax_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    pending_amount DECIMAL(15, 2) DEFAULT 0.00,
    notes TEXT,
    terms_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_client_id (client_id),
    INDEX idx_status (status),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: invoice_items
-- Purpose: Store individual line items for each invoice
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: payments
-- Purpose: Track payments received for invoices
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'cheque', 'credit_card', 'online', 'other') DEFAULT 'cash',
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: table_columns
-- Purpose: Store custom table column configurations
-- ============================================
CREATE TABLE IF NOT EXISTS table_columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    column_key VARCHAR(50) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    column_type ENUM('text', 'number', 'percentage', 'date') DEFAULT 'text',
    width VARCHAR(20) DEFAULT '100px',
    is_required BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_column_key (column_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: app_settings
-- Purpose: Store application settings and preferences
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: users
-- Purpose: Store user accounts for authentication
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: audit_logs
-- Purpose: Track all important system activities
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default company
INSERT INTO companies (name, owner, address, phone1, email, ntn) VALUES
('Healthcare Invoice System', 'System Admin', 'Business Address', '0345-5167742', 'business@example.com', '6309621-3');

-- Insert default app settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('invoice_prefix', 'INV', 'string', 'Invoice number prefix'),
('show_email_in_print', 'true', 'boolean', 'Show email in printed invoices'),
('show_phone_in_print', 'true', 'boolean', 'Show phone in printed invoices'),
('default_currency', 'PKR', 'string', 'Default currency symbol'),
('tax_rate', '0', 'number', 'Default tax rate percentage'),
('payment_terms', '30', 'number', 'Default payment terms in days');

-- Insert default table columns
INSERT INTO table_columns (column_key, column_name, column_type, width, is_required, is_visible, display_order) VALUES
('index', 'Item', 'text', '60px', TRUE, TRUE, 1),
('description', 'Description', 'text', '200px', TRUE, TRUE, 2),
('quantity', 'Qty', 'number', '80px', TRUE, TRUE, 3),
('unitPrice', 'Unit Price', 'number', '100px', TRUE, TRUE, 4),
('taxRate', 'Tax %', 'percentage', '80px', FALSE, TRUE, 5),
('discount', 'Discount %', 'percentage', '100px', FALSE, TRUE, 6),
('total', 'Total', 'number', '100px', TRUE, TRUE, 7);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View: Invoice Summary
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.invoice_date,
    i.due_date,
    i.status,
    c.name AS client_name,
    c.email AS client_email,
    i.total_amount,
    i.paid_amount,
    i.pending_amount,
    DATEDIFF(CURRENT_DATE, i.due_date) AS days_overdue
FROM invoices i
JOIN clients c ON i.client_id = c.id;

-- View: Client Outstanding Balance
CREATE OR REPLACE VIEW client_outstanding AS
SELECT 
    c.id AS client_id,
    c.name AS client_name,
    COUNT(i.id) AS total_invoices,
    SUM(i.total_amount) AS total_billed,
    SUM(i.paid_amount) AS total_paid,
    SUM(i.pending_amount) AS total_outstanding
FROM clients c
LEFT JOIN invoices i ON c.id = i.client_id
GROUP BY c.id, c.name;

-- View: Monthly Revenue
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    YEAR(invoice_date) AS year,
    MONTH(invoice_date) AS month,
    COUNT(*) AS invoice_count,
    SUM(total_amount) AS total_revenue,
    SUM(paid_amount) AS revenue_collected,
    SUM(pending_amount) AS revenue_pending
FROM invoices
GROUP BY YEAR(invoice_date), MONTH(invoice_date)
ORDER BY year DESC, month DESC;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Update Invoice Totals
DELIMITER //
CREATE PROCEDURE update_invoice_totals(IN inv_id INT)
BEGIN
    DECLARE inv_subtotal DECIMAL(15,2);
    DECLARE inv_tax DECIMAL(15,2);
    DECLARE inv_discount DECIMAL(15,2);
    DECLARE inv_total DECIMAL(15,2);
    DECLARE inv_paid DECIMAL(15,2);
    
    -- Calculate subtotal
    SELECT SUM(quantity * unit_price) INTO inv_subtotal
    FROM invoice_items
    WHERE invoice_id = inv_id;
    
    -- Calculate discount
    SELECT SUM((quantity * unit_price) * (discount_percentage / 100)) INTO inv_discount
    FROM invoice_items
    WHERE invoice_id = inv_id;
    
    -- Calculate tax
    SELECT SUM(((quantity * unit_price) - ((quantity * unit_price) * (discount_percentage / 100))) * (tax_rate / 100)) INTO inv_tax
    FROM invoice_items
    WHERE invoice_id = inv_id;
    
    -- Calculate total
    SET inv_total = IFNULL(inv_subtotal, 0) - IFNULL(inv_discount, 0) + IFNULL(inv_tax, 0);
    
    -- Get total paid
    SELECT IFNULL(SUM(amount), 0) INTO inv_paid
    FROM payments
    WHERE invoice_id = inv_id;
    
    -- Update invoice
    UPDATE invoices
    SET subtotal = IFNULL(inv_subtotal, 0),
        discount_amount = IFNULL(inv_discount, 0),
        tax_amount = IFNULL(inv_tax, 0),
        total_amount = inv_total,
        paid_amount = inv_paid,
        pending_amount = inv_total - inv_paid
    WHERE id = inv_id;
END //
DELIMITER ;

-- Procedure: Update Invoice Status Based on Payment
DELIMITER //
CREATE PROCEDURE update_invoice_status(IN inv_id INT)
BEGIN
    DECLARE inv_total DECIMAL(15,2);
    DECLARE inv_paid DECIMAL(15,2);
    DECLARE inv_due_date DATE;
    DECLARE new_status VARCHAR(20);
    
    SELECT total_amount, paid_amount, due_date 
    INTO inv_total, inv_paid, inv_due_date
    FROM invoices
    WHERE id = inv_id;
    
    IF inv_paid >= inv_total THEN
        SET new_status = 'paid';
    ELSEIF inv_paid > 0 THEN
        SET new_status = 'sent';
    ELSEIF CURRENT_DATE > inv_due_date THEN
        SET new_status = 'overdue';
    ELSE
        SET new_status = 'sent';
    END IF;
    
    UPDATE invoices
    SET status = new_status
    WHERE id = inv_id;
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update invoice totals after item insert
DELIMITER //
CREATE TRIGGER after_invoice_item_insert
AFTER INSERT ON invoice_items
FOR EACH ROW
BEGIN
    CALL update_invoice_totals(NEW.invoice_id);
END //
DELIMITER ;

-- Trigger: Update invoice totals after item update
DELIMITER //
CREATE TRIGGER after_invoice_item_update
AFTER UPDATE ON invoice_items
FOR EACH ROW
BEGIN
    CALL update_invoice_totals(NEW.invoice_id);
END //
DELIMITER ;

-- Trigger: Update invoice totals after item delete
DELIMITER //
CREATE TRIGGER after_invoice_item_delete
AFTER DELETE ON invoice_items
FOR EACH ROW
BEGIN
    CALL update_invoice_totals(OLD.invoice_id);
END //
DELIMITER ;

-- Trigger: Update invoice status after payment insert
DELIMITER //
CREATE TRIGGER after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    CALL update_invoice_totals(NEW.invoice_id);
    CALL update_invoice_status(NEW.invoice_id);
END //
DELIMITER ;

-- Trigger: Update invoice status after payment update
DELIMITER //
CREATE TRIGGER after_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    CALL update_invoice_totals(NEW.invoice_id);
    CALL update_invoice_status(NEW.invoice_id);
END //
DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_invoice_status_date ON invoices(status, invoice_date);
CREATE INDEX idx_client_status ON clients(status, name);
CREATE INDEX idx_payment_invoice_date ON payments(invoice_id, payment_date);

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Notes for Online Database Connection:
-- 1. Configure connection details in .env file
-- 2. Use connection pooling for better performance
-- 3. Implement proper error handling and retry logic
-- 4. Use prepared statements to prevent SQL injection
-- 5. Regular backups are essential for production
-- 6. Monitor query performance and optimize as needed

