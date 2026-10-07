/**
 * Database Configuration and Connection Module
 * 
 * Purpose: Manages online database connectivity for the invoice management system
 * Supports MySQL/MariaDB/PostgreSQL with connection pooling
 * 
 * Setup Instructions:
 * 1. Create a .env.local file in the root directory
 * 2. Add the following environment variables:
 * 
 * DATABASE_URL=mysql://username:password@host:port/database_name
 * DB_HOST=your_database_host
 * DB_PORT=3306
 * DB_USER=your_username
 * DB_PASSWORD=your_password
 * DB_NAME=invoice_management_system
 * DB_SSL=true (for production)
 * 
 * For PostgreSQL, use:
 * DATABASE_URL=postgresql://username:password@host:port/database_name
 */

import mysql from 'mysql2/promise'

// Database configuration interface
interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  waitForConnections: boolean
  connectionLimit: number
  queueLimit: number
  enableKeepAlive: boolean
  keepAliveInitialDelay: number
  ssl?: {
    rejectUnauthorized: boolean
  }
}

// Get database configuration from environment variables
const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'invoice_management_system',
    waitForConnections: true,
    connectionLimit: 10, // Maximum number of connections in the pool
    queueLimit: 0, // No limit on queued connection requests
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10 seconds
    // Enable SSL for production
    ...(isProduction && process.env.DB_SSL === 'true' && {
      ssl: {
        rejectUnauthorized: true,
      },
    }),
  }
}

// Create connection pool
let pool: mysql.Pool | null = null

export const getConnectionPool = (): mysql.Pool => {
  if (!pool) {
    const config = getDatabaseConfig()
    pool = mysql.createPool(config)
    
    // Test connection on initialization
    pool.getConnection()
      .then((connection) => {
        console.log('✅ Database connection established successfully')
        connection.release()
      })
      .catch((error) => {
        console.error('❌ Database connection failed:', error.message)
      })
  }
  
  return pool
}

// Execute query with error handling
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T> => {
  try {
    const pool = getConnectionPool()
    const [rows] = await pool.execute(query, params)
    return rows as T
  } catch (error) {
    console.error('Database query error:', error)
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Transaction wrapper
export const executeTransaction = async <T = any>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const pool = getConnectionPool()
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    console.error('Transaction error:', error)
    throw error
  } finally {
    connection.release()
  }
}

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const pool = getConnectionPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Close all connections (use this on app shutdown)
export const closeDatabaseConnections = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
    console.log('Database connections closed')
  }
}

// Database query helper functions
export const db = {
  // SELECT queries
  query: executeQuery,
  
  // INSERT query
  insert: async (table: string, data: Record<string, any>) => {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')
    
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    const result = await executeQuery<any>(query, values)
    return result.insertId
  },
  
  // UPDATE query
  update: async (table: string, data: Record<string, any>, where: string, whereParams: any[] = []) => {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const setClause = keys.map((key) => `${key} = ?`).join(', ')
    
    const query = `UPDATE ${table} SET ${setClause} WHERE ${where}`
    const result = await executeQuery<any>(query, [...values, ...whereParams])
    return result.affectedRows
  },
  
  // DELETE query
  delete: async (table: string, where: string, whereParams: any[] = []) => {
    const query = `DELETE FROM ${table} WHERE ${where}`
    const result = await executeQuery<any>(query, whereParams)
    return result.affectedRows
  },
  
  // SELECT ONE query
  selectOne: async <T = any>(table: string, where: string, whereParams: any[] = []): Promise<T | null> => {
    const query = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`
    const rows = await executeQuery<T[]>(query, whereParams)
    return rows.length > 0 ? rows[0] : null
  },
  
  // SELECT ALL query
  selectAll: async <T = any>(table: string, where: string = '1=1', whereParams: any[] = []): Promise<T[]> => {
    const query = `SELECT * FROM ${table} WHERE ${where}`
    return await executeQuery<T[]>(query, whereParams)
  },
  
  // Execute transaction
  transaction: executeTransaction,
  
  // Health check
  healthCheck: checkDatabaseHealth,
  
  // Close connections
  close: closeDatabaseConnections,
}

// Export default connection pool getter
export default getConnectionPool

/**
 * Usage Examples:
 * 
 * // Simple query
 * const invoices = await db.query<Invoice[]>('SELECT * FROM invoices WHERE status = ?', ['paid'])
 * 
 * // Insert
 * const clientId = await db.insert('clients', {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+92 300 1234567'
 * })
 * 
 * // Update
 * const updated = await db.update('invoices', 
 *   { status: 'paid', paid_amount: 5000 },
 *   'id = ?',
 *   [123]
 * )
 * 
 * // Transaction
 * const result = await db.transaction(async (connection) => {
 *   await connection.execute('INSERT INTO invoices (...) VALUES (...)')
 *   await connection.execute('INSERT INTO invoice_items (...) VALUES (...)')
 *   return { success: true }
 * })
 * 
 * // Health check
 * const isHealthy = await db.healthCheck()
 */

