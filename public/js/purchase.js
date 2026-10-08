// State
let memberList = [];
let cart = [];

// Elements
const memberSelect = document.getElementById('member_code');
const selectedMemberCard = document.getElementById('selectedMemberCard');
const smName = document.getElementById('smName');
const smCode = document.getElementById('smCode');
const smPoints = document.getElementById('smPoints');

const productSelect = document.getElementById('product_select');
const customProductFields = document.getElementById('customProductFields');
const customProductName = document.getElementById('custom_product_name');
const quantityInput = document.getElementById('quantity');
const qtyMinusBtn = document.getElementById('qtyMinusBtn');
const qtyPlusBtn = document.getElementById('qtyPlusBtn');
const addToCartBtn = document.getElementById('addToCartBtn');

const cartList = document.getElementById('cartList');
const cartCountBadge = document.getElementById('cartCountBadge');
const cartTotalBar = document.getElementById('cartTotalBar');
const cartSummaryQty = document.getElementById('cartSummaryQty');
const cartTotalPoints = document.getElementById('cartTotalPoints');
const submitCheckoutBtn = document.getElementById('submitCheckoutBtn');

// Result Elements
const resultBox = document.getElementById('resultBox');
const resMemberText = document.getElementById('resMemberText');
const resItemsText = document.getElementById('resItemsText');
const resEarnedText = document.getElementById('resEarnedText');
const resTotalText = document.getElementById('resTotalText');

// Scanner Modal Elements
const openScannerBtn = document.getElementById('openScannerBtn');
const closeScannerModalBtn = document.getElementById('closeScannerModalBtn');
const scannerModal = document.getElementById('scannerModal');
const cameraSelect = document.getElementById('cameraSelect');
const barcodeFileInput = document.getElementById('barcodeFileInput');

let html5QrCode = null;
let isScanning = false;

// Product Select & Quick Product Chips
if (productSelect) {
  productSelect.addEventListener('change', () => {
    if (productSelect.value === 'custom') {
      customProductFields.style.display = 'block';
      customProductName.focus();
    } else {
      customProductFields.style.display = 'none';
    }
    updateChips(productSelect.value);
  });
}

window.setProduct = function(name) {
  if (productSelect) {
    productSelect.value = name;
    if (name === 'custom') {
      customProductFields.style.display = 'block';
      customProductName.focus();
    } else {
      customProductFields.style.display = 'none';
    }
    updateChips(name);
  }
};

function updateChips(name) {
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${name}'`));
  });
}

// Quantity Stepper for Product Input
qtyMinusBtn.addEventListener('click', () => {
  let val = parseInt(quantityInput.value, 10) || 1;
  if (val > 1) quantityInput.value = val - 1;
});

qtyPlusBtn.addEventListener('click', () => {
  let val = parseInt(quantityInput.value, 10) || 1;
  quantityInput.value = val + 1;
});

// Cart Logic
function addToCart(productName, quantity) {
  const qty = parseInt(quantity, 10) || 1;
  const existingIndex = cart.findIndex(item => item.product_name.toLowerCase() === productName.toLowerCase());

  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
  } else {
    cart.push({ product_name: productName, quantity: qty });
  }

  showToast(`${productName} (${qty}x) ditambahkan ke keranjang.`, 'success');
  renderCart();
}

function updateCartQty(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    renderCart();
  }
}

function removeCartItem(index) {
  if (cart[index]) {
    const removed = cart.splice(index, 1);
    showToast(`${removed[0].product_name} dihapus dari keranjang.`, 'success');
    renderCart();
  }
}

function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPts = totalItems * 10;

  cartCountBadge.textContent = `${totalItems} Item`;

  if (cart.length === 0) {
    cartList.innerHTML = `
      <p style="text-align:center;color:var(--text-muted);padding:18px 0;font-size:13.5px;">
        Keranjang masih kosong. Pilih minuman di atas lalu klik "Masukkan ke Keranjang".
      </p>
    `;
    cartTotalBar.style.display = 'none';
    submitCheckoutBtn.disabled = true;
    return;
  }

  cartList.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="item-info">
        <div class="item-title">${item.product_name}</div>
        <div class="item-calc">${item.quantity}x &times; 10 poin = <span style="font-weight:700;color:var(--primary-dark);">+${item.quantity * 10} Poin</span></div>
      </div>
      <div class="item-actions">
        <div class="qty-control" style="max-width:110px;">
          <button type="button" style="width:28px;height:28px;font-size:13px;" onclick="updateCartQty(${idx}, -1)">&minus;</button>
          <span style="font-weight:700;padding:0 8px;font-size:14px;">${item.quantity}</span>
          <button type="button" style="width:28px;height:28px;font-size:13px;" onclick="updateCartQty(${idx}, 1)">&plus;</button>
        </div>
        <button type="button" class="btn danger sm icon-btn" title="Hapus Item" onclick="removeCartItem(${idx})">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');

  cartSummaryQty.textContent = `${totalItems} Minuman`;
  cartTotalPoints.textContent = `+${totalPts} Poin`;
  cartTotalBar.style.display = 'flex';
  submitCheckoutBtn.disabled = !memberSelect.value;
}

addToCartBtn.addEventListener('click', () => {
  const selVal = productSelect ? productSelect.value : '';
  let finalName = '';

  if (!selVal) {
    showToast('Pilih menu minuman terlebih dahulu.', 'error');
    if (productSelect) productSelect.focus();
    return;
  }

  if (selVal === 'custom') {
    finalName = customProductName.value.trim();
    if (!finalName) {
      showToast('Masukkan nama minuman kustom terlebih dahulu.', 'error');
      customProductName.focus();
      return;
    }
  } else {
    finalName = selVal;
  }

  const qty = parseInt(quantityInput.value, 10) || 1;
  addToCart(finalName, qty);

  if (selVal === 'custom') {
    customProductName.value = '';
  }
  quantityInput.value = 1;
});

// Member Selection
function selectMemberByCode(code) {
  if (!code) {
    selectedMemberCard.style.display = 'none';
    submitCheckoutBtn.disabled = true;
    return;
  }
  const found = memberList.find(m => m.member_code === code);
  if (found) {
    memberSelect.value = code;
    smName.textContent = found.full_name;
    smCode.textContent = found.member_code;
    smPoints.textContent = `${found.points} Poin`;
    selectedMemberCard.style.display = 'block';
    playBeepSound();
    showToast(`Member terpilih: ${found.full_name}`, 'success');
    renderCart();
  } else {
    showToast(`Member dengan ID "${code}" tidak ditemukan.`, 'error');
  }
}

memberSelect.addEventListener('change', () => {
  selectMemberByCode(memberSelect.value);
});

// Load Members
async function loadMembers(preselectCode) {
  try {
    const res = await fetch('/api/members');
    memberList = await res.json();

    if (memberList.length === 0) {
      memberSelect.innerHTML = '<option value="">-- Belum ada member terdaftar --</option>';
      return;
    }

    memberSelect.innerHTML = '<option value="">-- Pilih Member --</option>' +
      memberList.map(m => `<option value="${m.member_code}">${m.member_code} &mdash; ${m.full_name} (${m.points} poin)</option>`).join('');

    if (preselectCode) {
      selectMemberByCode(preselectCode);
    }
  } catch (err) {
    memberSelect.innerHTML = '<option value="">-- Gagal memuat data member --</option>';
  }
}

// Scanner Modal Controls
async function openScanner() {
  scannerModal.classList.add('show');
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Pustaka pemindai belum siap.', 'error');
    return;
  }

  html5QrCode = new Html5Qrcode('scannerRegion');
  const config = { fps: 15, qrbox: { width: 280, height: 140 } };

  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length > 0) {
      if (devices.length > 1) {
        cameraSelect.style.display = 'inline-block';
        cameraSelect.innerHTML = devices.map((d, i) =>
          `<option value="${d.id}">${d.label || 'Kamera ' + (i + 1)}</option>`
        ).join('');
      }
      const cameraId = cameraSelect.value || devices[devices.length - 1].id;

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
    showToast('Tidak bisa mengakses kamera. Gunakan upload gambar.', 'error');
  }
}

async function closeScanner() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (e) {}
  }
  isScanning = false;
  scannerModal.classList.remove('show');
}

function onScanSuccess(decodedText) {
  closeScanner();
  selectMemberByCode(decodedText.trim());
}

openScannerBtn.addEventListener('click', openScanner);
closeScannerModalBtn.addEventListener('click', closeScanner);
scannerModal.addEventListener('click', (e) => {
  if (e.target === scannerModal) closeScanner();
});

// Mirror Toggle Button (Default is Mirror ON)
const toggleMirrorBtn = document.getElementById('toggleMirrorBtn');
const mirrorBtnText = document.getElementById('mirrorBtnText');
const scannerViewfinderWrap = document.querySelector('.scanner-viewfinder-wrap');

if (toggleMirrorBtn && scannerViewfinderWrap) {
  toggleMirrorBtn.addEventListener('click', () => {
    scannerViewfinderWrap.classList.toggle('unmirrored');
    const isMirrored = !scannerViewfinderWrap.classList.contains('unmirrored');
    if (mirrorBtnText) {
      mirrorBtnText.textContent = isMirrored ? 'Mirror: ON' : 'Mirror: OFF';
    }
    showToast(isMirrored ? 'Kamera Mirror diaktifkan (Mode Cermin)' : 'Kamera Normal diaktifkan', 'success');
  });
}

// Barcode File Upload in Modal
if (barcodeFileInput) {
  barcodeFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    showToast('Memindai barcode dari gambar...', 'success');
    try {
      const scanner = new Html5Qrcode('scannerRegion');
      const decodedText = await scanner.scanFile(file, true);
      onScanSuccess(decodedText);
      scanner.clear();
    } catch (err) {
      showToast('Tidak ada barcode terdeteksi pada gambar.', 'error');
    }
    barcodeFileInput.value = '';
  });
}

// Checkout Submit (Multi-Item Cart)
submitCheckoutBtn.addEventListener('click', async () => {
  const member_code = memberSelect.value;
  if (!member_code) {
    showToast('Silakan pilih member terlebih dahulu.', 'error');
    return;
  }
  if (cart.length === 0) {
    showToast('Keranjang belanja masih kosong.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_code,
        items: cart
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Gagal memproses transaksi.', 'error');
      return;
    }

    playBeepSound();
    showToast(data.message, 'success');

    // Tampilkan rangkuman hasil
    resMemberText.textContent = `Member: ${data.full_name} (${data.member_code})`;
    resItemsText.textContent = `Produk dibeli: ${cart.map(i => `${i.product_name} (${i.quantity}x)`).join(', ')}`;
    resEarnedText.textContent = `+${data.points_earned} Poin`;
    resTotalText.textContent = `${data.total_points} Poin`;
    resultBox.style.display = 'block';

    // Kosongkan keranjang
    cart = [];
    renderCart();

    // Refresh member data
    await loadMembers(data.member_code);
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
});

// Inisialisasi
const urlParams = new URLSearchParams(window.location.search);
loadMembers(urlParams.get('member_code'));
renderCart();
