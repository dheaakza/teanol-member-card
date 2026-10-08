-- ============================================
-- Database untuk TEANOL Member Card System
-- ============================================

CREATE DATABASE IF NOT EXISTS teanol_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE teanol_db;

CREATE TABLE IF NOT EXISTS members (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  member_code   VARCHAR(30)  NOT NULL UNIQUE,
  full_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  DEFAULT NULL,
  email         VARCHAR(100) DEFAULT NULL,
  address       VARCHAR(255) DEFAULT NULL,
  join_date     DATE         NOT NULL,
  points        INT          NOT NULL DEFAULT 0,
  card_pdf_path VARCHAR(255) DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index tambahan untuk pencarian cepat
CREATE INDEX idx_full_name ON members (full_name);
CREATE INDEX idx_join_date ON members (join_date);

-- ============================================
-- Riwayat pembelian (setiap pembelian menambah poin member)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  member_id      INT NOT NULL,
  member_code    VARCHAR(30) NOT NULL,
  product_name   VARCHAR(100) DEFAULT 'Minuman',
  quantity       INT NOT NULL DEFAULT 1,
  points_earned  INT NOT NULL,
  purchase_date  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_purchase_member ON purchases (member_id);
CREATE INDEX idx_purchase_date ON purchases (purchase_date);

-- ============================================
-- Katalog hadiah yang bisa ditukar dengan poin
-- ============================================
CREATE TABLE IF NOT EXISTS rewards (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  reward_name   VARCHAR(150) NOT NULL,
  points_cost   INT NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beberapa hadiah contoh (silakan ubah/tambah sesuai kebutuhan)
INSERT INTO rewards (reward_name, points_cost) VALUES
  ('Gratis 1 Thai Tea Original', 100),
  ('Gratis 1 Topping', 40),
  ('Diskon 20% Pembelian', 80),
  ('Tumbler TEANOL', 150);

-- ============================================
-- Riwayat penukaran poin
-- ============================================
CREATE TABLE IF NOT EXISTS redemptions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  member_id      INT NOT NULL,
  member_code    VARCHAR(30) NOT NULL,
  reward_id      INT DEFAULT NULL,
  reward_name    VARCHAR(150) NOT NULL,
  points_used    INT NOT NULL,
  redeemed_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE SET NULL
);

CREATE INDEX idx_redemption_member ON redemptions (member_id);
CREATE INDEX idx_redemption_date ON redemptions (redeemed_at);
