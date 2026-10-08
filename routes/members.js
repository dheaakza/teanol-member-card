const express = require('express');
const router = express.Router();
const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const generateMemberCard = require('../utils/generateCard');


/**
 * Membuat kode member unik dengan format: TEANOL-<tahun>-<nomor urut>
 * Contoh: TEANOL-2026-00001
 *
 * PENTING: nomor urut dihitung dari angka TERTINGGI yang sudah pernah dipakai
 * (bukan dari jumlah baris/COUNT(*)), supaya kalau ada member yang dihapus,
 * nomor yang sudah terpakai tidak dibuat ulang dan bentrok (duplicate entry).
 */
async function generateMemberCode() {
  const year = new Date().getFullYear();
  const prefix = `TEANOL-${year}-`;

  const [rows] = await db.query(
    `SELECT MAX(CAST(SUBSTRING(member_code, LENGTH(?) + 1) AS UNSIGNED)) AS maxNumber
     FROM members
     WHERE member_code LIKE ?`,
    [prefix, `${prefix}%`]
  );

  const nextNumber = (rows[0].maxNumber || 0) + 1;
  const padded = String(nextNumber).padStart(5, '0');
  return `${prefix}${padded}`;
}

// ============================================
// CREATE - Tambah member baru + generate kartu
// ============================================
router.post('/', async (req, res) => {
  try {
    const { full_name, phone, email, address, join_date } = req.body;

    if (!full_name || !join_date) {
      return res.status(400).json({ message: 'Nama dan tanggal bergabung wajib diisi.' });
    }

    // Coba insert dengan kode baru; kalau ternyata masih bentrok (misalnya dua
    // pendaftaran terjadi hampir bersamaan), buat ulang kode & coba lagi (maks 5x)
    // supaya member tetap berhasil didaftarkan tanpa error ke pengguna.
    let member_code;
    let result;
    const MAX_RETRY = 5;

    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      member_code = await generateMemberCode();
      try {
        [result] = await db.query(
          `INSERT INTO members (member_code, full_name, phone, email, address, join_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [member_code, full_name, phone || null, email || null, address || null, join_date]
        );
        break; // berhasil, keluar dari loop
      } catch (insertErr) {
        const isDuplicateCode = insertErr.code === 'ER_DUP_ENTRY' && insertErr.sqlMessage?.includes('member_code');
        if (isDuplicateCode && attempt < MAX_RETRY) {
          continue; // coba lagi dengan kode berikutnya
        }
        throw insertErr;
      }
    }

    // Generate kartu PDF
    const pdfPath = await generateMemberCard({ member_code, full_name, join_date });
    const relativePath = `/cards/${member_code}.pdf`;

    await db.query('UPDATE members SET card_pdf_path = ? WHERE id = ?', [
      relativePath,
      result.insertId
    ]);

    res.status(201).json({
      message: 'Member berhasil ditambahkan dan kartu berhasil dibuat.',
      id: result.insertId,
      member_code,
      card_url: relativePath,
      card_pdf_path: relativePath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message });
  }
});

// ============================================
// READ - Ambil semua member (untuk rekap)
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM members ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// READ - Cari member berdasarkan ID Member / isi barcode
// Dipakai oleh fitur "Scan Barcode Member" (kamera/scanner)
// ============================================
router.get('/lookup/:member_code', async (req, res) => {
  try {
    const code = req.params.member_code.trim();
    const [rows] = await db.query('SELECT * FROM members WHERE member_code = ?', [code]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Barcode tidak dikenali. Member tidak ditemukan.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// READ - Generate Barcode PNG langsung untuk Member
// ============================================
router.get('/barcode/:member_code', async (req, res) => {
  try {
    const code = req.params.member_code.trim();
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 3,
      height: 12,
      includetext: false,
      backgroundcolor: 'FFFFFF'
    });
    res.type('png');
    res.send(png);
  } catch (err) {
    res.status(400).json({ message: 'Gagal membuat barcode.', error: err.message });
  }
});

// ============================================
// READ - Riwayat lengkap (pembelian & penukaran) 1 member
// ============================================
router.get('/history/:member_code', async (req, res) => {
  try {
    const code = req.params.member_code.trim();
    const [purchases] = await db.query(
      'SELECT * FROM purchases WHERE member_code = ? ORDER BY purchase_date DESC LIMIT 15',
      [code]
    );
    const [redemptions] = await db.query(
      'SELECT * FROM redemptions WHERE member_code = ? ORDER BY redeemed_at DESC LIMIT 15',
      [code]
    );
    res.json({ purchases, redemptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ============================================
// READ - Download Kartu PDF Member
// ============================================
router.get('/download-card/:member_code', async (req, res) => {
  try {
    const code = req.params.member_code.trim();
    const [rows] = await db.query('SELECT * FROM members WHERE member_code = ?', [code]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }
    const member = rows[0];
    const outputDir = path.join(__dirname, '..', 'generated_cards');
    const filePath = path.join(outputDir, `${member.member_code}.pdf`);

    // Jika file fisik PDF belum ada di disk, generate otomatis
    if (!fs.existsSync(filePath)) {
      await generateMemberCard({
        member_code: member.member_code,
        full_name: member.full_name,
        join_date: member.join_date
      });
    }

    res.download(filePath, `Kartu-Member-${member.member_code}.pdf`);
  } catch (err) {
    console.error('Error downloading card:', err);
    res.status(500).json({ message: 'Gagal mengunduh kartu member.', error: err.message });
  }
});


// ============================================
// READ - Ambil satu member berdasarkan ID atau Member Code
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id ? req.params.id.trim() : '';
    let rows;
    if (/^\d+$/.test(param)) {
      [rows] = await db.query('SELECT * FROM members WHERE id = ? OR member_code = ?', [param, param]);
    } else {
      [rows] = await db.query('SELECT * FROM members WHERE member_code = ?', [param]);
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// UPDATE - Perbarui data member & regenerate kartu (ID atau Member Code)
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const param = req.params.id ? req.params.id.trim() : '';
    const { full_name, phone, email, address, join_date } = req.body;
    let existingRows;
    if (/^\d+$/.test(param)) {
      [existingRows] = await db.query('SELECT * FROM members WHERE id = ? OR member_code = ?', [param, param]);
    } else {
      [existingRows] = await db.query('SELECT * FROM members WHERE member_code = ?', [param]);
    }

    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }

    const existing = existingRows[0];

    await db.query(
      `UPDATE members SET full_name = ?, phone = ?, email = ?, address = ?, join_date = ?
       WHERE id = ?`,
      [
        full_name || existing.full_name,
        phone ?? existing.phone,
        email ?? existing.email,
        address ?? existing.address,
        join_date || existing.join_date,
        existing.id
      ]
    );

    // Regenerate kartu dengan data terbaru
    await generateMemberCard({
      member_code: existing.member_code,
      full_name: full_name || existing.full_name,
      join_date: join_date || existing.join_date
    });

    res.json({ message: 'Member berhasil diperbarui dan kartu diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// DELETE - Hapus member (berdasarkan ID atau Member Code)
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const param = req.params.id ? req.params.id.trim() : '';
    let result;
    if (/^\d+$/.test(param)) {
      [result] = await db.query('DELETE FROM members WHERE id = ? OR member_code = ?', [param, param]);
    } else {
      [result] = await db.query('DELETE FROM members WHERE member_code = ?', [param]);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }
    res.json({ message: 'Member berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
