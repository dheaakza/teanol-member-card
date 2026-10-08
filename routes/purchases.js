const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Setiap 1 minuman = 10 poin
const POINTS_PER_ITEM = 10;

// ============================================
// CREATE - Catat pembelian & tambah poin otomatis (Mendukung multi-item keranjang)
// ============================================
router.post('/', async (req, res) => {
  try {
    const { member_code, product_name, quantity, items } = req.body;

    if (!member_code) {
      return res.status(400).json({ message: 'ID Member wajib dipilih.' });
    }

    // Cari member berdasarkan kode
    const [memberRows] = await db.query(
      'SELECT * FROM members WHERE member_code = ?',
      [member_code]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: 'Member tidak ditemukan. Periksa kembali ID Member.' });
    }

    const member = memberRows[0];

    // Normalisasi daftar item (array keranjang atau single item)
    let purchaseItems = [];
    if (Array.isArray(items) && items.length > 0) {
      purchaseItems = items.map(it => ({
        product_name: it.product_name || 'Minuman',
        quantity: parseInt(it.quantity, 10) > 0 ? parseInt(it.quantity, 10) : 1
      }));
    } else {
      const qty = parseInt(quantity, 10) > 0 ? parseInt(quantity, 10) : 1;
      purchaseItems = [{ product_name: product_name || 'Minuman', quantity: qty }];
    }

    let totalPointsEarned = 0;
    let totalItemsQty = 0;

    for (const item of purchaseItems) {
      const itemPoints = item.quantity * POINTS_PER_ITEM;
      totalPointsEarned += itemPoints;
      totalItemsQty += item.quantity;

      await db.query(
        `INSERT INTO purchases (member_id, member_code, product_name, quantity, points_earned)
         VALUES (?, ?, ?, ?, ?)`,
        [member.id, member.member_code, item.product_name, item.quantity, itemPoints]
      );
    }

    // Tambahkan poin akumulasi ke member
    await db.query(
      'UPDATE members SET points = points + ? WHERE id = ?',
      [totalPointsEarned, member.id]
    );

    const [updatedRows] = await db.query('SELECT points FROM members WHERE id = ?', [member.id]);

    res.status(201).json({
      message: `Pembelian berhasil dicatat. ${member.full_name} mendapat ${totalPointsEarned} poin (${totalItemsQty} item).`,
      member_code: member.member_code,
      full_name: member.full_name,
      total_items: totalItemsQty,
      points_earned: totalPointsEarned,
      total_points: updatedRows[0].points,
      items: purchaseItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
});


// ============================================
// READ - Riwayat semua pembelian (rekap transaksi)
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, m.full_name
       FROM purchases p
       JOIN members m ON m.id = p.member_id
       ORDER BY p.purchase_date DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// READ - Riwayat pembelian untuk 1 member tertentu
// ============================================
router.get('/member/:member_code', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM purchases WHERE member_code = ? ORDER BY purchase_date DESC`,
      [req.params.member_code]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
