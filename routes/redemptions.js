const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ============================================
// CREATE - Tukar poin member dengan hadiah
// ============================================
router.post('/', async (req, res) => {
  try {
    const { member_code, reward_id, reward_name, points_cost } = req.body;

    if (!member_code) {
      return res.status(400).json({ message: 'ID Member wajib dipilih.' });
    }

    // Cari member
    const [memberRows] = await db.query(
      'SELECT * FROM members WHERE member_code = ?',
      [member_code]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }

    const member = memberRows[0];
    let finalRewardName = reward_name;
    let finalPointsCost = parseInt(points_cost, 10);
    let finalRewardId = reward_id || null;

    // Jika reward_id diberikan, ambil data resmi dari katalog (lebih terpercaya daripada input manual)
    if (reward_id) {
      const [rewardRows] = await db.query('SELECT * FROM rewards WHERE id = ?', [reward_id]);
      if (rewardRows.length === 0) {
        return res.status(404).json({ message: 'Hadiah tidak ditemukan di katalog.' });
      }
      finalRewardName = rewardRows[0].reward_name;
      finalPointsCost = rewardRows[0].points_cost;
    }

    if (!finalRewardName || !finalPointsCost || finalPointsCost <= 0) {
      return res.status(400).json({ message: 'Data hadiah tidak valid.' });
    }

    if (member.points < finalPointsCost) {
      return res.status(400).json({
        message: `Poin tidak cukup. ${member.full_name} memiliki ${member.points} poin, butuh ${finalPointsCost} poin.`
      });
    }

    // Catat riwayat penukaran
    await db.query(
      `INSERT INTO redemptions (member_id, member_code, reward_id, reward_name, points_used)
       VALUES (?, ?, ?, ?, ?)`,
      [member.id, member.member_code, finalRewardId, finalRewardName, finalPointsCost]
    );

    // Kurangi poin member
    await db.query('UPDATE members SET points = points - ? WHERE id = ?', [finalPointsCost, member.id]);

    const [updatedRows] = await db.query('SELECT points FROM members WHERE id = ?', [member.id]);

    res.status(201).json({
      message: `Penukaran berhasil. ${member.full_name} menukar "${finalRewardName}" dengan ${finalPointsCost} poin.`,
      member_code: member.member_code,
      full_name: member.full_name,
      reward_name: finalRewardName,
      points_used: finalPointsCost,
      remaining_points: updatedRows[0].points
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
});

// ============================================
// READ - Riwayat semua penukaran poin
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, m.full_name
       FROM redemptions r
       JOIN members m ON m.id = r.member_id
       ORDER BY r.redeemed_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// READ - Riwayat penukaran untuk 1 member tertentu
// ============================================
router.get('/member/:member_code', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM redemptions WHERE member_code = ? ORDER BY redeemed_at DESC`,
      [req.params.member_code]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
