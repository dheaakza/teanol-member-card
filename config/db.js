require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const dbName = process.env.DB_NAME || 'teanol_db';

const pool = mysql.createPool({
  ...dbConfig,
  database: dbName
});

async function initDb() {
  try {
    const rootConn = await mysql.createConnection(dbConfig);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_code VARCHAR(30) NOT NULL UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        address VARCHAR(255) DEFAULT NULL,
        join_date DATE NOT NULL,
        points INT NOT NULL DEFAULT 0,
        card_pdf_path VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_full_name (full_name),
        INDEX idx_join_date (join_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        member_code VARCHAR(30) NOT NULL,
        product_name VARCHAR(100) DEFAULT 'Minuman',
        quantity INT NOT NULL DEFAULT 1,
        points_earned INT NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        INDEX idx_purchase_member (member_id),
        INDEX idx_purchase_date (purchase_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reward_name VARCHAR(150) NOT NULL,
        points_cost INT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS redemptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        member_code VARCHAR(30) NOT NULL,
        reward_id INT DEFAULT NULL,
        reward_name VARCHAR(150) NOT NULL,
        points_used INT NOT NULL,
        redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE SET NULL,
        INDEX idx_redemption_member (member_id),
        INDEX idx_redemption_date (redeemed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [rewards] = await pool.query('SELECT COUNT(*) as count FROM rewards');
    if (rewards[0].count === 0) {
      await pool.query(`
        INSERT INTO rewards (reward_name, points_cost) VALUES
          ('Gratis 1 Thai Tea Original', 100),
          ('Gratis 1 Topping', 40),
          ('Diskon 20% Pembelian', 80),
          ('Tumbler TEANOL', 150);
      `);
    }

    console.log('✅ Database & Tabel TEANOL berhasil diverifikasi / diinisialisasi.');
  } catch (err) {
    console.error('⚠️ Gagal inisialisasi database otomatis:', err.message);
  }
}

module.exports = pool;
module.exports.initDb = initDb;

