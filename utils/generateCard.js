const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');

const YELLOW = '#FFC72C';
const YELLOW_SOFT = '#FFD966';
const DARK = '#1A1A1A';
const DARK_LIGHT = '#4A3F1F';
const CREAM = '#FFFDF6';

/**
 * Membuat buffer gambar PNG barcode (Code128) dari sebuah teks (ID Member).
 * Barcode inilah yang nantinya dipindai (scan) di halaman "Scan Member".
 * @param {string} text - teks yang akan di-encode ke barcode (member_code)
 * @returns {Promise<Buffer>} buffer PNG barcode
 */
function generateBarcodeBuffer(text) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128',       // jenis barcode: Code 128 (umum & mudah dipindai)
        text: text,             // isi barcode = ID Member (contoh: TEANOL-2026-00001)
        scale: 3,               // resolusi/kepadatan garis
        height: 10,              // tinggi barcode dalam mm
        includetext: false,      // teks ID sudah ditulis manual di bawah barcode
        backgroundcolor: 'FFFFFF'
      },
      (err, png) => {
        if (err) return reject(err);
        resolve(png);
      }
    );
  });
}

/**
 * Membuat kartu member dalam format PDF **2 halaman/2 sisi** (bolak-balik),
 * berukuran kartu standar (CR80, 3.375in x 2.125in):
 *   - Halaman 1 = SISI DEPAN: desain elegan kuning khas TEANOL, logo, nama member, ID.
 *   - Halaman 2 = SISI BELAKANG: tema gelap dengan barcode (Code128) besar berisi
 *     ID Member, untuk dipindai lewat fitur "Scan Member".
 * @param {{member_code: string, full_name: string, join_date: string}} member
 * @returns {Promise<string>} path lengkap file PDF yang dihasilkan
 */
async function generateMemberCard(member) {
  // Generate barcode PNG dulu (di luar Promise PDF) agar bisa langsung di-embed ke dokumen
  let barcodeBuffer = null;
  try {
    barcodeBuffer = await generateBarcodeBuffer(member.member_code);
  } catch (err) {
    console.error('Gagal membuat barcode member:', err.message);
  }

  return new Promise((resolve, reject) => {
    const cardWidth = 243;  // 3.375 inch
    const cardHeight = 153; // 2.125 inch

    const outputDir = path.join(__dirname, '..', 'generated_cards');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `${member.member_code}.pdf`;
    const filePath = path.join(outputDir, fileName);

    const doc = new PDFDocument({ size: [cardWidth, cardHeight], margin: 0 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');

    // ============================================================
    // HALAMAN 1 — SISI DEPAN KARTU
    // ============================================================

    // === Background gradasi kuning elegan ===
    const bgGradient = doc.linearGradient(0, 0, cardWidth, cardHeight);
    bgGradient.stop(0, YELLOW_SOFT).stop(1, YELLOW);
    doc.rect(0, 0, cardWidth, cardHeight).fill(bgGradient);

    // === Border ganda gelap ===
    doc.lineWidth(1.4).strokeColor(DARK)
      .roundedRect(6, 6, cardWidth - 12, cardHeight - 12, 8).stroke();
    doc.lineWidth(0.5).strokeColor(DARK)
      .roundedRect(9, 9, cardWidth - 18, cardHeight - 18, 6).stroke();

    // Aksen sudut kecil (ornamen garis siku gelap)
    const cornerLen = 9;
    const corners = [
      [12, 12, 1, 0, 1, 1],   // top-left
      [cardWidth - 12, 12, -1, 0, -1, 1], // top-right
      [12, cardHeight - 12, 1, 0, 1, -1], // bottom-left
      [cardWidth - 12, cardHeight - 12, -1, 0, -1, -1] // bottom-right
    ];
    doc.lineWidth(1).strokeColor(DARK_LIGHT);
    corners.forEach(([x, y, dx1, dy1, dx2, dy2]) => {
      doc.moveTo(x, y).lineTo(x + dx1 * cornerLen, y + dy1 * cornerLen).stroke();
      doc.moveTo(x, y).lineTo(x + dx2 * 0, y + dy2 * cornerLen).stroke();
    });

    // === Logo dalam badge lingkaran putih ===
    const badgeCenterX = cardWidth / 2;
    const badgeCenterY = 30;
    const badgeRadius = 21;

    doc.circle(badgeCenterX, badgeCenterY, badgeRadius).fill('#FFFFFF');
    doc.lineWidth(1.2).strokeColor(DARK)
      .circle(badgeCenterX, badgeCenterY, badgeRadius).stroke();

    if (fs.existsSync(logoPath)) {
      const logoSize = 32;
      doc.image(logoPath, badgeCenterX - logoSize / 2, badgeCenterY - logoSize / 2, {
        width: logoSize,
        height: logoSize
      });
    }

    // === Nama usaha ===
    doc.fillColor(DARK)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text('T E A N O L', 0, 55, { align: 'center', width: cardWidth, characterSpacing: 1.5 });

    doc.fillColor(DARK_LIGHT)
      .font('Helvetica-Oblique')
      .fontSize(6.3)
      .text('The Real Thai Tea   •   Est 2016', 0, 72, { align: 'center', width: cardWidth });

    // Garis pemisah dengan ornamen diamond di tengah
    const dividerY = 84;
    doc.moveTo(20, dividerY).lineTo(cardWidth / 2 - 6, dividerY).strokeColor(DARK).lineWidth(0.6).stroke();
    doc.moveTo(cardWidth / 2 + 6, dividerY).lineTo(cardWidth - 20, dividerY).strokeColor(DARK).lineWidth(0.6).stroke();
    doc.save()
      .translate(cardWidth / 2, dividerY)
      .rotate(45)
      .rect(-2.5, -2.5, 5, 5)
      .fill(DARK)
      .restore();

    // === Label MEMBER CARD ===
    doc.font('Helvetica-Bold').fontSize(7)
      .fillColor(DARK)
      .text('MEMBER CARD', 18, 91, { width: cardWidth - 36, characterSpacing: 1.5 });

    // === Nama Member ===
    doc.font('Helvetica-Bold').fontSize(12.5)
      .fillColor(DARK)
      .text(member.full_name.toUpperCase(), 18, 102, { width: cardWidth - 36, height: 16, ellipsis: true });

    // Garis tipis gelap di atas footer
    doc.moveTo(18, cardHeight - 24).lineTo(cardWidth - 18, cardHeight - 24)
      .strokeColor(DARK).lineWidth(0.4).stroke();

    // === ID & Tanggal Bergabung (footer) ===
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(8.5)
      .text(member.member_code, 18, cardHeight - 18, { width: (cardWidth - 36) * 0.62 });

    doc.fillColor(DARK_LIGHT).font('Helvetica').fontSize(6.5)
      .text(`Bergabung: ${member.join_date}`, cardWidth - 100, cardHeight - 17, {
        width: 82,
        align: 'right'
      });

    // ============================================================
    // HALAMAN 2 — SISI BELAKANG KARTU (berisi barcode)
    // ============================================================
    doc.addPage({ size: [cardWidth, cardHeight], margin: 0 });

    // === Background gelap ===
    doc.rect(0, 0, cardWidth, cardHeight).fill(DARK);

    // === Border kuning ===
    doc.lineWidth(1.4).strokeColor(YELLOW)
      .roundedRect(6, 6, cardWidth - 12, cardHeight - 12, 8).stroke();
    doc.lineWidth(0.5).strokeColor(YELLOW_SOFT)
      .roundedRect(9, 9, cardWidth - 18, cardHeight - 18, 6).stroke();

    // === Strip kuning tipis di atas (mirip strip magnetik kartu) ===
    doc.rect(9, 16, cardWidth - 18, 14).fill(YELLOW_SOFT);

    // === Judul kecil ===
    doc.fillColor(YELLOW)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('T E A N O L', 0, 37, { align: 'center', width: cardWidth, characterSpacing: 1.3 });

    doc.fillColor('#C9BE8F')
      .font('Helvetica')
      .fontSize(5.6)
      .text('Kartu Member Resmi — Sisi Barcode', 0, 48, { align: 'center', width: cardWidth });

    // === Kotak putih untuk barcode (kontras maksimal agar mudah dipindai) ===
    const boxX = 20;
    const boxY = 58;
    const boxW = cardWidth - 40;
    const boxH = 46;
    doc.roundedRect(boxX, boxY, boxW, boxH, 4).fill('#FFFFFF');

    if (barcodeBuffer) {
      const padding = 6;
      doc.image(barcodeBuffer, boxX + padding, boxY + padding, {
        width: boxW - padding * 2,
        height: boxH - padding * 2
      });
    } else {
      // Fallback jika pembuatan barcode gagal, supaya kartu tetap ter-generate
      doc.fillColor(DARK).font('Helvetica-Oblique').fontSize(7)
        .text('Barcode tidak tersedia', boxX, boxY + boxH / 2 - 4, { width: boxW, align: 'center' });
    }

    // === ID Member di bawah barcode (bisa dibaca manual jika perlu) ===
    doc.fillColor(YELLOW)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(member.member_code, 0, boxY + boxH + 8, { align: 'center', width: cardWidth, characterSpacing: 0.8 });

    // === Catatan kaki ===
    doc.fillColor('#B8AF8A')
      .font('Helvetica')
      .fontSize(5.4)
      .text(
        'Tunjukkan barcode ini saat transaksi & penukaran poin di seluruh outlet TEANOL.',
        20, boxY + boxH + 22,
        { width: cardWidth - 40, align: 'center', lineGap: 1 }
      );

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = generateMemberCard;
