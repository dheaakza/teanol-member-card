-- ============================================
-- MIGRASI: Tambah fitur Tukar Poin
-- Jalankan file ini SATU KALI SAJA jika database kamu
-- belum memiliki tabel "rewards" dan "redemptions".
-- ============================================

-- Sesuaikan nama database di bawah ini jika database kamu
-- bernama berbeda (misalnya "teanol" tanpa "_db")
USE teanol_db;

-- Katalog hadiah yang bisa ditukar dengan poin
CREATE TABLE IF NOT EXISTS rewards (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  reward_name   VARCHAR(150) NOT NULL,
  points_cost   INT NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beberapa hadiah contoh (silakan ubah/tambah/hapus sesuai kebutuhan)
INSERT INTO rewards (reward_name, points_cost) VALUES
  ('Gratis 1 Thai Tea Original', 100),
  ('Gratis 1 Topping', 40),
  ('Diskon 20% Pembelian', 80),
  ('Tumbler TEANOL', 150);

-- Riwayat penukaran poin
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
