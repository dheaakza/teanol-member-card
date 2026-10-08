const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================
// READ - Ambil semua hadiah aktif
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM rewards WHERE is_active = 1 ORDER BY points_cost ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// CREATE - Tambah hadiah baru ke katalog
// ============================================
router.post('/', async (req, res) => {
  try {
    const { reward_name, points_cost } = req.body;

    if (!reward_name || !points_cost || points_cost <= 0) {
      return res.status(400).json({ message: 'Nama hadiah dan jumlah poin wajib diisi dengan benar.' });
    }

    const [result] = await db.query(
      'INSERT INTO rewards (reward_name, points_cost) VALUES (?, ?)',
      [reward_name, points_cost]
    );

    res.status(201).json({ message: 'Hadiah berhasil ditambahkan.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// UPDATE - Perbarui data hadiah di katalog
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { reward_name, points_cost } = req.body;
    if (!reward_name || !points_cost || parseInt(points_cost, 10) <= 0) {
      return res.status(400).json({ message: 'Nama hadiah dan jumlah poin wajib diisi dengan benar.' });
    }

    const [result] = await db.query(
      'UPDATE rewards SET reward_name = ?, points_cost = ? WHERE id = ?',
      [reward_name, parseInt(points_cost, 10), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Hadiah tidak ditemukan.' });
    }

    res.json({ message: 'Hadiah berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// DELETE - Nonaktifkan hadiah (tidak dihapus permanen agar riwayat tetap utuh)
// ============================================

router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE rewards SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Hadiah dinonaktifkan.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
