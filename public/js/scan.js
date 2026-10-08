const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const scannerBox = document.getElementById('scannerBox');
const cameraSelectContainer = document.getElementById('cameraSelectContainer');
const cameraSelect = document.getElementById('cameraSelect');
const manualCode = document.getElementById('manualCode');
const manualLookupBtn = document.getElementById('manualLookupBtn');

const memberScanCard = document.getElementById('memberScanCard');
const mscCode = document.getElementById('mscCode');
const mscName = document.getElementById('mscName');
const mscBarcodeImg = document.getElementById('mscBarcodeImg');
const mscBarcodeLabel = document.getElementById('mscBarcodeLabel');
const mscEarnedBadge = document.getElementById('mscEarnedBadge');
const mscPointsBadge = document.getElementById('mscPointsBadge');
const mscPointsVal = document.getElementById('mscPointsVal');
const mscJoin = document.getElementById('mscJoin');
const mscAddMoreBtn = document.getElementById('mscAddMoreBtn');
const mscRedeemLink = document.getElementById('mscRedeemLink');
const mscCardLink = document.getElementById('mscCardLink');

let html5QrCode = null;
let isScanning = false;
let lastScannedCode = null;

// Tampilkan data kartu member
function renderMemberCard(member, pointsEarned) {
  lastScannedCode = member.member_code;

  mscCode.textContent = member.member_code;
  mscName.textContent = member.full_name;
  mscBarcodeLabel.textContent = member.member_code;
  mscBarcodeImg.src = `/api/members/barcode/${encodeURIComponent(member.member_code)}`;
  mscPointsBadge.textContent = `${member.points || 0} Poin`;
  mscPointsVal.textContent = `${member.points || 0} Poin`;
  mscJoin.textContent = formatDate(member.join_date);

  mscRedeemLink.href = `/redeem.html?member_code=${encodeURIComponent(member.member_code)}`;

  if (member.card_pdf_path) {
    mscCardLink.href = member.card_pdf_path;
    mscCardLink.style.display = 'inline-flex';
  } else {
    mscCardLink.style.display = 'none';
  }

  mscEarnedBadge.textContent = `+${pointsEarned} Poin Ditambahkan!`;
  memberScanCard.style.display = 'block';
  memberScanCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Alur Scan & Catat Pembelian (+10 Poin)
async function scanAndRecordPurchase(code) {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    showToast('Masukkan atau scan ID Member terlebih dahulu.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_code: trimmed, product_name: 'Minuman', quantity: 1 })
    });

    const data = await res.json();

    if (!res.ok) {
      memberScanCard.style.display = 'none';
      showToast(data.message || 'Member tidak ditemukan.', 'error');
      return;
    }

    playBeepSound();
    showToast(`Berhasil! ${data.full_name} mendapat +${data.points_earned} poin.`, 'success');

    // Ambil data lengkap member
    const memberRes = await fetch(`/api/members/lookup/${encodeURIComponent(data.member_code)}`);
    const member = await memberRes.json();
    if (memberRes.ok) {
      renderMemberCard(member, data.points_earned);
    } else {
      renderMemberCard({
        member_code: data.member_code,
        full_name: data.full_name,
        points: data.total_points,
        join_date: null,
        card_pdf_path: null
      }, data.points_earned);
    }

    manualCode.value = '';
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
}

mscAddMoreBtn.addEventListener('click', () => {
  if (lastScannedCode) {
    scanAndRecordPurchase(lastScannedCode);
  }
});

// Kamera Scanner
async function startScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Pustaka pemindai belum siap.', 'error');
    return;
  }

  scannerBox.classList.add('show');
  html5QrCode = new Html5Qrcode('scannerRegion');
  const config = { fps: 15, qrbox: { width: 280, height: 140 } };

  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length > 0) {
      if (devices.length > 1 && cameraSelect) {
        cameraSelectContainer.style.display = 'flex';
        cameraSelect.innerHTML = devices.map((d, i) =>
          `<option value="${d.id}">${d.label || 'Kamera ' + (i + 1)}</option>`
        ).join('');
      }
      const cameraId = cameraSelect ? cameraSelect.value || devices[devices.length - 1].id : devices[devices.length - 1].id;

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => onScanSuccess(decodedText),
        () => {}
      );
    } else {
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => onScanSuccess(decodedText),
        () => {}
      );
    }
    isScanning = true;
  } catch (err) {
    scannerBox.classList.remove('show');
    showToast('Tidak bisa mengakses kamera.', 'error');
  }
}

async function stopScanner() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (e) {}
  }
  isScanning = false;
  scannerBox.classList.remove('show');
}

function onScanSuccess(decodedText) {
  stopScanner();
  manualCode.value = decodedText;
  scanAndRecordPurchase(decodedText);
}

startScanBtn.addEventListener('click', startScanner);
stopScanBtn.addEventListener('click', stopScanner);

manualLookupBtn.addEventListener('click', () => scanAndRecordPurchase(manualCode.value));
manualCode.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    scanAndRecordPurchase(manualCode.value);
  }
});

// Scan dari file gambar / foto barcode
const barcodeFileInput = document.getElementById('barcodeFileInput');
if (barcodeFileInput) {
  barcodeFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    showToast('Memindai barcode dari gambar...', 'success');
    try {
      const scanner = new Html5Qrcode("scannerRegion");
      const decodedText = await scanner.scanFile(file, true);
      onScanSuccess(decodedText);
      scanner.clear();
    } catch (err) {
      showToast('Tidak ada barcode yang terdeteksi pada gambar ini.', 'error');
    }
    barcodeFileInput.value = '';
  });
}

