-- ============================================
-- MIGRASI: Tambah fitur Poin Member
-- Jalankan file ini SATU KALI SAJA jika database kamu
-- sudah dibuat sebelumnya (sebelum fitur poin ditambahkan).
-- Jika kamu baru mulai dari nol, cukup jalankan database.sql saja
-- dan LEWATI file ini.
-- ============================================

-- Sesuaikan nama database di bawah ini jika database kamu
-- bernama berbeda (misalnya "teanol" tanpa "_db")
USE teanol_db;

-- Tambah kolom poin ke tabel members (jika belum ada)
ALTER TABLE members ADD COLUMN points INT NOT NULL DEFAULT 0 AFTER join_date;

-- Buat tabel riwayat pembelian (jika belum ada)
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
