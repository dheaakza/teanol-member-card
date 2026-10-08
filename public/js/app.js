/**
 * TEANOL Member Card System - Unified SPA Application
 * URL: Clean localhost:3000 without slash or page navigation
 */

// ============================================================
// Global State & Cache
// ============================================================
let allMembers = [];
let allRewards = [];
let posCart = []; // [{ name: 'Thai Tea Original', qty: 1 }]
let activeScanCallback = null;
let html5QrCode = null;
let isScanning = false;

// ============================================================
// DOM Elements
// ============================================================
// Tabs
const navTabMembers = document.getElementById('navTabMembers');
const navTabPurchase = document.getElementById('navTabPurchase');
const navTabRedeem = document.getElementById('navTabRedeem');
const viewMembers = document.getElementById('view-members');
const viewPurchase = document.getElementById('view-purchase');
const viewRedeem = document.getElementById('view-redeem');

// Member Stats & Table
const totalMembersEl = document.getElementById('totalMembers');
const totalThisMonthEl = document.getElementById('totalThisMonth');
const totalPointsEl = document.getElementById('totalPoints');
const searchInput = document.getElementById('searchInput');
const memberTableBody = document.getElementById('memberTableBody');

// Add Member Modal
const openAddModalBtn = document.getElementById('openAddModalBtn');
const addMemberModal = document.getElementById('addMemberModal');
const closeAddModalBtn = document.getElementById('closeAddModalBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const addMemberForm = document.getElementById('addMemberForm');
const regJoinDate = document.getElementById('regJoinDate');

// Detail Member Modal
const detailMemberModal = document.getElementById('detailMemberModal');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
const detName = document.getElementById('detName');
const detCode = document.getElementById('detCode');
const detPointsBadge = document.getElementById('detPointsBadge');
const detBarcodeImg = document.getElementById('detBarcodeImg');
const detPhone = document.getElementById('detPhone');
const detJoinDate = document.getElementById('detJoinDate');
const detEmail = document.getElementById('detEmail');
const detAddress = document.getElementById('detAddress');
const detWaBtn = document.getElementById('detWaBtn');
const detBuyBtn = document.getElementById('detBuyBtn');
const detRedeemBtn = document.getElementById('detRedeemBtn');
const detPdfBtn = document.getElementById('detPdfBtn');
const detHistoryContainer = document.getElementById('detHistoryContainer');

// POS Purchase Elements
const posMemberSelect = document.getElementById('posMemberSelect');
const posOpenScannerBtn = document.getElementById('posOpenScannerBtn');
const posSelectedMemberCard = document.getElementById('posSelectedMemberCard');
const posSmName = document.getElementById('posSmName');
const posSmCode = document.getElementById('posSmCode');
const posSmPoints = document.getElementById('posSmPoints');
const posProductSelect = document.getElementById('posProductSelect');
const posCustomFields = document.getElementById('posCustomFields');
const posCustomName = document.getElementById('posCustomName');
const posQuantity = document.getElementById('posQuantity');
const posQtyMinusBtn = document.getElementById('posQtyMinusBtn');
const posQtyPlusBtn = document.getElementById('posQtyPlusBtn');
const posAddToCartBtn = document.getElementById('posAddToCartBtn');
const posCartList = document.getElementById('posCartList');
const posCartBadge = document.getElementById('posCartBadge');
const posCartSummary = document.getElementById('posCartSummary');
const posCartTotalQty = document.getElementById('posCartTotalQty');
const posCartTotalPts = document.getElementById('posCartTotalPts');
const posCheckoutBtn = document.getElementById('posCheckoutBtn');
const posResultBox = document.getElementById('posResultBox');
const posResMember = document.getElementById('posResMember');
const posResItems = document.getElementById('posResItems');
const posResEarned = document.getElementById('posResEarned');
const posResTotal = document.getElementById('posResTotal');

// Tukar Poin Elements
const redeemOpenScannerBtn = document.getElementById('redeemOpenScannerBtn');
const redeemForm = document.getElementById('redeemForm');
const redeemMemberCode = document.getElementById('redeem_member_code');
const redeemSelectedMemberCard = document.getElementById('redeemSelectedMemberCard');
const rdSmName = document.getElementById('rdSmName');
const rdSmCode = document.getElementById('rdSmCode');
const rdSmPoints = document.getElementById('rdSmPoints');
const redeemRewardId = document.getElementById('redeem_reward_id');
const redeemCustomFields = document.getElementById('redeemCustomFields');
const redeemCustomName = document.getElementById('redeem_custom_name');
const redeemCustomPoints = document.getElementById('redeem_custom_points');
const redeemValidationNotice = document.getElementById('redeemValidationNotice');
const redeemSubmitBtn = document.getElementById('redeemSubmitBtn');
const rewardsGrid = document.getElementById('rewardsGrid');
const redeemHistoryTableBody = document.getElementById('redeemHistoryTableBody');

// Rewards CRUD Modal
const openAddRewardModalBtn = document.getElementById('openAddRewardModalBtn');
const rewardModal = document.getElementById('rewardModal');
const closeRewardModalBtn = document.getElementById('closeRewardModalBtn');
const cancelRewardBtn = document.getElementById('cancelRewardBtn');
const rewardForm = document.getElementById('rewardForm');
const rewardModalTitle = document.getElementById('rewardModalTitle');
const rewardModalSub = document.getElementById('rewardModalSub');
const rewardEditId = document.getElementById('reward_edit_id');
const rewardName = document.getElementById('reward_name');
const rewardPointsCost = document.getElementById('reward_points_cost');
const rewardDescription = document.getElementById('reward_description');

// Pure Camera Scanner Elements
const scannerModal = document.getElementById('scannerModal');
const closeScannerModalBtn = document.getElementById('closeScannerModalBtn');
const cameraSelect = document.getElementById('cameraSelect');
const scanFileInput = document.getElementById('scanFileInput');

// ============================================================
// 1. SPA Navigation (Always Clean URL localhost:3000)
// ============================================================
function switchTab(tab) {
  // Update Buttons
  [navTabMembers, navTabPurchase, navTabRedeem].forEach(btn => btn.classList.remove('active'));
  [viewMembers, viewPurchase, viewRedeem].forEach(view => view.classList.remove('active'));

  if (tab === 'purchase') {
    navTabPurchase.classList.add('active');
    viewPurchase.classList.add('active');
    populateMemberDropdowns();
    loadPurchaseHistory();
  } else if (tab === 'redeem') {
    navTabRedeem.classList.add('active');
    viewRedeem.classList.add('active');
    populateMemberDropdowns();
    loadRewards();
    loadRedeemHistory();
  } else {
    navTabMembers.classList.add('active');
    viewMembers.classList.add('active');
    loadMembers();
  }

  // Ensure URL is clean http://localhost:3000 (no slash, no hash)
  if (window.location.pathname !== '/' || window.location.hash || window.location.search) {
    window.history.replaceState(null, '', window.location.origin);
  }
}

navTabMembers.addEventListener('click', () => switchTab('members'));
navTabPurchase.addEventListener('click', () => switchTab('purchase'));
navTabRedeem.addEventListener('click', () => switchTab('redeem'));

// ============================================================
// 2. Member Management
// ============================================================
async function loadMembers() {
  try {
    const res = await fetch('/api/members');
    allMembers = await res.json();
    updateStats(allMembers);
    renderMemberTable(allMembers);
    populateMemberDropdowns();
  } catch (err) {
    console.error('Error loading members:', err);
    memberTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--danger);">Gagal memuat data member. Pastikan server aktif.</td></tr>`;
  }
}

function updateStats(list) {
  totalMembersEl.textContent = list.length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const thisMonthCount = list.filter(m => {
    if (!m.join_date) return false;
    const d = new Date(m.join_date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;
  totalThisMonthEl.textContent = thisMonthCount;

  const sumPoints = list.reduce((acc, m) => acc + (parseInt(m.points, 10) || 0), 0);
  totalPointsEl.textContent = sumPoints.toLocaleString('id-ID');
}

function renderMemberTable(list) {
  if (list.length === 0) {
    memberTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">
          Tidak ada data member yang sesuai.
        </td>
      </tr>
    `;
    return;
  }

  memberTableBody.innerHTML = list.map((m, idx) => `
    <tr>
      <td style="color:var(--text-muted);font-weight:600;">${idx + 1}</td>
      <td>
        <span style="font-weight:700;color:var(--dark);letter-spacing:0.5px;">${escapeHtml(m.member_code)}</span>
      </td>
      <td>
        <span style="font-weight:600;color:var(--dark);">${escapeHtml(m.full_name)}</span>
      </td>
      <td style="color:var(--dark-light);">${m.phone ? escapeHtml(m.phone) : '<span style="color:var(--text-light);">-</span>'}</td>
      <td style="color:var(--dark-light);">${formatDate(m.join_date)}</td>
      <td>
        <span class="badge-points">
          <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span class="pts-num">${(m.points || 0).toLocaleString('id-ID')}</span>
          <span class="pts-lbl">Poin</span>
        </span>
      </td>
      <td style="text-align:right;">
        <div style="display:flex;gap:6px;justify-content:flex-end;">
          <button type="button" class="btn secondary sm icon-btn" title="Lihat Detail & Barcode" onclick="openMemberDetail('${escapeHtml(m.member_code)}')">
            <svg class="icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button type="button" class="btn danger sm icon-btn" title="Hapus Member" onclick="deleteMember('${escapeHtml(m.member_code)}', '${escapeHtml(m.full_name)}')">
            <svg class="icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Search Filter
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) {
    renderMemberTable(allMembers);
    return;
  }
  const filtered = allMembers.filter(m =>
    (m.member_code && m.member_code.toLowerCase().includes(q)) ||
    (m.full_name && m.full_name.toLowerCase().includes(q)) ||
    (m.phone && m.phone.toLowerCase().includes(q)) ||
    (m.email && m.email.toLowerCase().includes(q))
  );
  renderMemberTable(filtered);
});

// Add Member Modal handlers
openAddModalBtn.addEventListener('click', () => {
  addMemberForm.reset();
  const today = new Date().toISOString().split('T')[0];
  const joinInput = document.getElementById('reg_join_date');
  if (joinInput) joinInput.value = today;
  addMemberModal.classList.add('show');
});

closeAddModalBtn.addEventListener('click', () => addMemberModal.classList.remove('show'));
cancelAddBtn.addEventListener('click', () => addMemberModal.classList.remove('show'));
addMemberModal.addEventListener('click', (e) => {
  if (e.target === addMemberModal) addMemberModal.classList.remove('show');
});

addMemberForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submitRegBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Mendaftarkan...';

  const payload = {
    full_name: document.getElementById('reg_full_name').value.trim(),
    phone: document.getElementById('reg_phone').value.trim(),
    email: document.getElementById('reg_email').value.trim(),
    address: document.getElementById('reg_address').value.trim(),
    join_date: document.getElementById('reg_join_date').value
  };

  try {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Gagal mendaftarkan member.', 'error');
      return;
    }
    showToast(`Member ${data.member_code} berhasil didaftarkan!`, 'success');
    addMemberModal.classList.remove('show');
    await loadMembers();
    openMemberDetail(data.member_code);
  } catch (err) {
    showToast('Terjadi kesalahan jaringan.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Daftarkan & Buat Barcode';
  }
});

// Member Detail Modal
async function openMemberDetail(memberCode) {
  try {
    let member = null;

    // Fetch member data from API
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(memberCode)}`);
      if (res.ok) {
        member = await res.json();
      }
    } catch (e) {
      console.warn('Network issue fetching member detail:', e);
    }

    // Cache fallback
    if (!member && Array.isArray(allMembers)) {
      member = allMembers.find(m => m.member_code === memberCode || String(m.id) === String(memberCode));
    }

    if (!member) {
      showToast('Data member tidak ditemukan.', 'error');
      return;
    }

    detName.textContent = member.full_name;
    detCode.textContent = member.member_code;
    detPointsBadge.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <span class="pts-num">${(member.points || 0).toLocaleString('id-ID')}</span> <span class="pts-lbl">Poin</span>
    `;

    // Barcode: Pure clean barcode without text ID below
    detBarcodeImg.src = `/api/members/barcode/${encodeURIComponent(member.member_code)}?t=${Date.now()}`;

    detPhone.textContent = member.phone || '-';
    detJoinDate.textContent = formatDate(member.join_date);
    detEmail.textContent = member.email || '-';
    detAddress.textContent = member.address || '-';

    // WhatsApp Link
    if (member.phone) {
      let cleanPhone = member.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
      detWaBtn.href = `https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(member.full_name)},%20terima%20kasih%20telah%20menjadi%20member%20setia%20TEANOL!`;
      detWaBtn.style.display = 'inline-flex';
    } else {
      detWaBtn.style.display = 'none';
    }

    // PDF Link (unduh kartu member)
    const pdfUrl = member.card_pdf_path || `/cards/${encodeURIComponent(member.member_code)}.pdf`;
    detPdfBtn.href = pdfUrl;
    detPdfBtn.setAttribute('download', `Kartu-Member-${member.member_code}.pdf`);

    // Catat Pembelian Aksi
    detBuyBtn.onclick = () => {
      detailMemberModal.classList.remove('show');
      switchTab('purchase');
      posMemberSelect.value = member.member_code;
      handlePosMemberChange();
    };

    // Tukar Poin Aksi
    detRedeemBtn.onclick = () => {
      detailMemberModal.classList.remove('show');
      switchTab('redeem');
      redeemMemberCode.value = member.member_code;
      handleRedeemMemberChange();
    };

    // Load History
    loadMemberHistory(member.member_code);

    detailMemberModal.classList.add('show');
  } catch (err) {
    showToast('Gagal memuat detail member.', 'error');
  }
}

async function loadMemberHistory(memberCode) {
  detHistoryContainer.innerHTML = 'Memuat riwayat transaksi...';
  try {
    const res = await fetch(`/api/members/history/${encodeURIComponent(memberCode)}`);
    if (!res.ok) {
      detHistoryContainer.innerHTML = '<span style="color:var(--text-light);">Belum ada riwayat transaksi.</span>';
      return;
    }
    const data = await res.json();
    const purchases = data.purchases || [];
    const redemptions = data.redemptions || [];

    if (purchases.length === 0 && redemptions.length === 0) {
      detHistoryContainer.innerHTML = '<span style="color:var(--text-light);">Belum ada catatan transaksi untuk member ini.</span>';
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px;max-height:160px;overflow-y:auto;padding-right:4px;">';

    purchases.slice(0, 5).forEach(p => {
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;border:1px solid var(--border);border-radius:6px;padding:8px 12px;">
          <div>
            <strong style="color:var(--dark);font-size:13px;">${escapeHtml(p.product_name)}</strong>
            <span style="font-size:11.5px;color:var(--text-muted);margin-left:6px;">(${p.quantity} cup)</span>
            <div style="font-size:11px;color:var(--text-light);">${formatDateTime(p.created_at)}</div>
          </div>
          <span style="color:#059669;font-weight:700;font-size:12.5px;">+${p.points_earned || (p.quantity * 10)} Poin</span>
        </div>
      `;
    });

    redemptions.slice(0, 5).forEach(r => {
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;background:#FFFBEB;border:1px solid #FCD34D;border-radius:6px;padding:8px 12px;">
          <div>
            <strong style="color:var(--dark);font-size:13px;">Tukar: ${escapeHtml(r.reward_name)}</strong>
            <div style="font-size:11px;color:var(--text-light);">${formatDateTime(r.created_at)}</div>
          </div>
          <span style="color:#D97706;font-weight:700;font-size:12.5px;">-${r.points_spent} Poin</span>
        </div>
      `;
    });

    html += '</div>';
    detHistoryContainer.innerHTML = html;
  } catch (err) {
    detHistoryContainer.innerHTML = '<span style="color:var(--text-light);">-</span>';
  }
}

closeDetailModalBtn.addEventListener('click', () => detailMemberModal.classList.remove('show'));
detailMemberModal.addEventListener('click', (e) => {
  if (e.target === detailMemberModal) detailMemberModal.classList.remove('show');
});

// Delete Member
async function deleteMember(code, name) {
  if (!confirm(`Apakah Anda yakin ingin menghapus member ${name} (${code})?\nSemua riwayat pembelian dan poin member ini akan ikut terhapus.`)) {
    return;
  }
  try {
    const res = await fetch(`/api/members/${encodeURIComponent(code)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Gagal menghapus member.', 'error');
      return;
    }
    showToast(`Member ${name} berhasil dihapus.`, 'success');
    await loadMembers();
  } catch (err) {
    showToast('Terjadi kesalahan saat menghapus.', 'error');
  }
}

window.openMemberDetail = openMemberDetail;
window.deleteMember = deleteMember;

// Populate Member Dropdowns in POS and Tukar Poin
function populateMemberDropdowns() {
  const optionsHtml = '<option value="">-- Pilih Member --</option>' +
    allMembers.map(m => `<option value="${escapeHtml(m.member_code)}">${escapeHtml(m.member_code)} - ${escapeHtml(m.full_name)} (${(m.points || 0)} Poin)</option>`).join('');

  if (posMemberSelect) {
    const currentVal = posMemberSelect.value;
    posMemberSelect.innerHTML = optionsHtml;
    if (currentVal && allMembers.some(m => m.member_code === currentVal)) {
      posMemberSelect.value = currentVal;
    }
  }

  if (redeemMemberCode) {
    const currentVal = redeemMemberCode.value;
    redeemMemberCode.innerHTML = optionsHtml;
    if (currentVal && allMembers.some(m => m.member_code === currentVal)) {
      redeemMemberCode.value = currentVal;
    }
  }
}

// ============================================================
// 3. Input Pembelian POS Cashier
// ============================================================
function handlePosMemberChange() {
  const code = posMemberSelect.value;
  const member = allMembers.find(m => m.member_code === code);
  if (!member) {
    posSelectedMemberCard.style.display = 'none';
  } else {
    posSmName.textContent = member.full_name;
    posSmCode.textContent = member.member_code;
    posSmPoints.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <span class="pts-num">${(member.points || 0).toLocaleString('id-ID')}</span> <span class="pts-lbl">Poin</span>
    `;
    posSelectedMemberCard.style.display = 'block';
  }
  updatePosCheckoutState();
}

posMemberSelect.addEventListener('change', handlePosMemberChange);

// POS Product Select & Custom Fields handling (Identical to Tukar Poin)
if (posProductSelect) {
  posProductSelect.addEventListener('change', () => {
    if (posProductSelect.value === 'custom') {
      posCustomFields.style.display = 'block';
      posCustomName.focus();
    } else {
      posCustomFields.style.display = 'none';
    }
    updatePosChipState(posProductSelect.value);
  });
}

function selectPosDrink(val) {
  if (posProductSelect) {
    posProductSelect.value = val;
    if (val === 'custom') {
      posCustomFields.style.display = 'block';
      posCustomName.focus();
    } else {
      posCustomFields.style.display = 'none';
    }
    updatePosChipState(val);
  }
}

function updatePosChipState(activeVal) {
  document.querySelectorAll('.menu-chips .chip-btn').forEach(btn => {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${activeVal}'`)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Quantity Steppers
if (posQtyMinusBtn && posQuantity) {
  posQtyMinusBtn.addEventListener('click', () => {
    const cur = parseInt(posQuantity.value, 10) || 1;
    if (cur > 1) posQuantity.value = cur - 1;
  });
}

if (posQtyPlusBtn && posQuantity) {
  posQtyPlusBtn.addEventListener('click', () => {
    const cur = parseInt(posQuantity.value, 10) || 1;
    posQuantity.value = cur + 1;
  });
}

// Add to Cart from Select / Custom Field with Qty
if (posAddToCartBtn) {
  posAddToCartBtn.addEventListener('click', () => {
    const selVal = posProductSelect ? posProductSelect.value : '';
    let finalName = '';

    if (!selVal) {
      showToast('Pilih menu minuman terlebih dahulu.', 'error');
      if (posProductSelect) posProductSelect.focus();
      return;
    }

    if (selVal === 'custom') {
      finalName = posCustomName.value.trim();
      if (!finalName) {
        showToast('Masukkan nama minuman kustom terlebih dahulu.', 'error');
        posCustomName.focus();
        return;
      }
    } else {
      finalName = selVal;
    }

    const qty = parseInt(posQuantity ? posQuantity.value : 1, 10) || 1;
    posAddToCartWithQty(finalName, qty);

    // Reset custom name if used
    if (selVal === 'custom') {
      posCustomName.value = '';
    }
    if (posQuantity) posQuantity.value = 1;
  });
}

if (posCustomName) {
  posCustomName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (posAddToCartBtn) posAddToCartBtn.click();
    }
  });
}

function posAddToCartWithQty(name, qty = 1) {
  const cleanName = name.trim();
  if (!cleanName || qty <= 0) return;

  const existing = posCart.find(i => i.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    existing.qty += qty;
  } else {
    posCart.push({ name: cleanName, qty: qty });
  }

  renderPosCart();
  showToast(`Ditambahkan ke keranjang: ${cleanName} (${qty}x)`, 'success');
}

// Legacy helper for quick add
function posAddToCart(name) {
  posAddToCartWithQty(name, 1);
}

function posUpdateQty(index, change) {
  if (!posCart[index]) return;
  posCart[index].qty += change;
  if (posCart[index].qty <= 0) {
    posCart.splice(index, 1);
  }
  renderPosCart();
}

function posRemoveItem(index) {
  if (!posCart[index]) return;
  posCart.splice(index, 1);
  renderPosCart();
}

function renderPosCart() {
  if (posCart.length === 0) {
    posCartList.innerHTML = `
      <div class="cart-empty">
        <svg class="icon" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <div>Keranjang masih kosong.</div>
        <div style="font-size:12px;margin-top:2px;">Pilih menu minuman di sebelah kiri untuk menambahkan.</div>
      </div>
    `;
    posCartBadge.textContent = '0 Item';
    posCartSummary.style.display = 'none';
    updatePosCheckoutState();
    return;
  }

  const totalQty = posCart.reduce((sum, item) => sum + item.qty, 0);
  const totalPts = totalQty * 10;

  posCartBadge.textContent = `${totalQty} Cup`;

  posCartList.innerHTML = posCart.map((item, idx) => `
    <div class="cart-item">
      <div class="item-info">
        <div class="item-title">${escapeHtml(item.name)}</div>
        <div class="item-calc">+${item.qty * 10} Poin (${item.qty} × 10)</div>
      </div>
      <div class="item-actions">
        <div class="qty-control sm">
          <button type="button" onclick="posUpdateQty(${idx}, -1)">&minus;</button>
          <input type="text" value="${item.qty}" readonly>
          <button type="button" onclick="posUpdateQty(${idx}, 1)">&plus;</button>
        </div>
        <button type="button" class="btn danger sm icon-btn" title="Hapus dari keranjang" onclick="posRemoveItem(${idx})" style="width:32px;height:32px;">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');

  posCartTotalQty.textContent = `${totalQty} Minuman`;
  posCartTotalPts.textContent = `+${totalPts} Poin`;
  posCartSummary.style.display = 'flex';

  updatePosCheckoutState();
}

function updatePosCheckoutState() {
  const hasMember = Boolean(posMemberSelect.value);
  const hasItems = posCart.length > 0;
  posCheckoutBtn.disabled = !(hasMember && hasItems);
}

// Checkout POS
posCheckoutBtn.addEventListener('click', async () => {
  const memberCode = posMemberSelect.value;
  if (!memberCode) {
    showToast('Silakan pilih member terlebih dahulu.', 'error');
    posMemberSelect.focus();
    return;
  }
  if (posCart.length === 0) {
    showToast('Keranjang masih kosong.', 'error');
    return;
  }

  posCheckoutBtn.disabled = true;
  posCheckoutBtn.textContent = 'Memproses Transaksi...';
  posResultBox.style.display = 'none';

  const payload = {
    member_code: memberCode,
    items: posCart.map(i => ({ product_name: i.name, quantity: i.qty }))
  };

  try {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Gagal memproses transaksi.', 'error');
      return;
    }

    playBeepSound();
    showToast(`Transaksi berhasil! +${data.points_earned} Poin ditambahkan.`, 'success');

    // Show Receipt Result
    const memberName = (data.member && data.member.full_name) || data.full_name || '';
    const memberCodeStr = (data.member && data.member.member_code) || data.member_code || '';
    const totalPts = (data.member && data.member.current_points) !== undefined ? data.member.current_points : (data.total_points !== undefined ? data.total_points : 0);
    posResMember.textContent = `Member: ${memberName} (${memberCodeStr})`;
    posResItems.textContent = `Item: ${posCart.map(i => `${i.name} (x${i.qty})`).join(', ')}`;
    posResEarned.textContent = `+${data.points_earned} Poin`;
    posResTotal.textContent = `${totalPts.toLocaleString('id-ID')} Poin`;
    posResultBox.style.display = 'block';

    // Reset Cart
    posCart = [];
    renderPosCart();

    // Reload members list & purchase history in background
    await loadMembers();
    handlePosMemberChange();
    loadPurchaseHistory();
  } catch (err) {
    showToast('Terjadi kesalahan server.', 'error');
  } finally {
    posCheckoutBtn.textContent = 'Proses Transaksi & Tambah Poin';
    updatePosCheckoutState();
  }
});

// Load and Render Riwayat Transaksi Pembelian
async function loadPurchaseHistory() {
  const tbody = document.getElementById('purchaseHistoryTableBody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/purchases');
    if (!res.ok) throw new Error('Gagal memuat');
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">Belum ada catatan transaksi pembelian.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map((item, idx) => `
      <tr>
        <td style="color:var(--text-light);font-size:12.5px;">${idx + 1}</td>
        <td><strong style="color:var(--dark);font-family:monospace;font-size:13px;">${escapeHtml(item.member_code)}</strong></td>
        <td><strong>${escapeHtml(item.full_name || '-')}</strong></td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--dark);">
            <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
            ${escapeHtml(item.product_name)}
          </span>
        </td>
        <td>
          <span class="badge" style="background:#F1F5F9;color:var(--dark);font-weight:700;">${item.quantity} Cup</span>
        </td>
        <td>
          <span class="badge-points" style="font-size:12px;padding:3px 10px;">
            <svg class="icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span class="pts-num">+${item.points_earned}</span> <span class="pts-lbl">Poin</span>
          </span>
        </td>
        <td style="font-size:12.5px;color:var(--text-muted);">${formatDateTime(item.purchase_date)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error loading purchase history:', err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--danger);">Gagal memuat riwayat pembelian.</td></tr>';
  }
}

// Window global bindings for inline handlers
window.selectPosDrink = selectPosDrink;
window.posUpdateQty = posUpdateQty;
window.posRemoveItem = posRemoveItem;
window.loadPurchaseHistory = loadPurchaseHistory;

// POS Scanner Button
posOpenScannerBtn.addEventListener('click', () => {
  openCameraScanner((scannedCode) => {
    posMemberSelect.value = scannedCode;
    if (posMemberSelect.value !== scannedCode) {
      showToast(`Member dengan kode "${scannedCode}" tidak ditemukan.`, 'error');
      return;
    }
    handlePosMemberChange();
    showToast(`Member "${scannedCode}" berhasil dipilih!`, 'success');
  });
});

// ============================================================
// 4. Tukar Poin & Katalog Hadiah
// ============================================================
function handleRedeemMemberChange() {
  const code = redeemMemberCode.value;
  const member = allMembers.find(m => m.member_code === code);
  if (!member) {
    redeemSelectedMemberCard.style.display = 'none';
  } else {
    rdSmName.textContent = member.full_name;
    rdSmCode.textContent = member.member_code;
    rdSmPoints.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <span class="pts-num">${(member.points || 0).toLocaleString('id-ID')}</span> <span class="pts-lbl">Poin</span>
    `;
    redeemSelectedMemberCard.style.display = 'block';
  }
  validateRedeemPoints();
}

redeemMemberCode.addEventListener('change', handleRedeemMemberChange);

async function loadRewards() {
  try {
    const res = await fetch('/api/rewards');
    allRewards = await res.json();

    // Populate dropdown
    let opts = '<option value="">-- Pilih Hadiah dari Katalog --</option>';
    allRewards.forEach(r => {
      opts += `<option value="${r.id}" data-cost="${r.points_cost}">${escapeHtml(r.reward_name)} (${r.points_cost} Poin)</option>`;
    });
    opts += '<option value="custom">Hadiah Kustom (Isi Nama & Poin Manual)</option>';
    redeemRewardId.innerHTML = opts;

    // Render Grid
    renderRewardsGrid(allRewards);
  } catch (err) {
    rewardsGrid.innerHTML = '<p style="color:var(--text-muted);">Gagal memuat katalog hadiah.</p>';
  }
}

function renderRewardsGrid(rewards) {
  if (rewards.length === 0) {
    rewardsGrid.innerHTML = '<p style="color:var(--text-muted);padding:12px;">Belum ada hadiah di katalog. Tambahkan hadiah baru!</p>';
    return;
  }

  rewardsGrid.innerHTML = rewards.map(r => `
    <div class="reward-card">
      <div>
        <div class="reward-card-top">
          <span class="cost-badge">${r.points_cost} Poin</span>
        </div>
        <div class="title">${escapeHtml(r.reward_name)}</div>
        ${r.description ? `<p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">${escapeHtml(r.description)}</p>` : ''}
      </div>
      <div class="reward-card-actions">
        <button type="button" class="btn secondary sm" style="flex:1;" onclick="quickSelectReward(${r.id})">
          Tukar Ini
        </button>
        <button type="button" class="btn secondary sm icon-btn" title="Edit Hadiah" onclick="openEditRewardModal(${r.id})">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button type="button" class="btn danger sm icon-btn" title="Hapus Hadiah" onclick="deleteReward(${r.id}, '${escapeHtml(r.reward_name)}')">
          <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function quickSelectReward(rewardId) {
  redeemRewardId.value = rewardId;
  redeemCustomFields.style.display = 'none';
  validateRedeemPoints();
  redeemForm.scrollIntoView({ behavior: 'smooth' });
}

redeemRewardId.addEventListener('change', () => {
  if (redeemRewardId.value === 'custom') {
    redeemCustomFields.style.display = 'block';
  } else {
    redeemCustomFields.style.display = 'none';
  }
  validateRedeemPoints();
});

redeemCustomPoints.addEventListener('input', validateRedeemPoints);

function validateRedeemPoints() {
  const memberCode = redeemMemberCode.value;
  const rewardVal = redeemRewardId.value;

  if (!memberCode || !rewardVal) {
    redeemValidationNotice.style.display = 'none';
    redeemSubmitBtn.disabled = true;
    return;
  }

  const member = allMembers.find(m => m.member_code === memberCode);
  const currentPoints = member ? (member.points || 0) : 0;

  let needed = 0;
  if (rewardVal === 'custom') {
    needed = parseInt(redeemCustomPoints.value, 10) || 0;
  } else {
    const selectedOption = redeemRewardId.options[redeemRewardId.selectedIndex];
    needed = parseInt(selectedOption.getAttribute('data-cost'), 10) || 0;
  }

  if (needed <= 0) {
    redeemValidationNotice.style.display = 'none';
    redeemSubmitBtn.disabled = true;
    return;
  }

  redeemValidationNotice.style.display = 'block';
  if (currentPoints >= needed) {
    redeemValidationNotice.style.background = '#ECFDF5';
    redeemValidationNotice.style.color = '#065F46';
    redeemValidationNotice.style.border = '1px solid #A7F3D0';
    redeemValidationNotice.textContent = `Poin mencukupi: Butuh ${needed} Poin (Saldo member: ${currentPoints} Poin, sisa: ${currentPoints - needed} Poin).`;
    redeemSubmitBtn.disabled = false;
  } else {
    redeemValidationNotice.style.background = '#FEF2F2';
    redeemValidationNotice.style.color = '#991B1B';
    redeemValidationNotice.style.border = '1px solid #FECACA';
    redeemValidationNotice.textContent = `Poin tidak cukup: Butuh ${needed} Poin, namun saldo member hanya ${currentPoints} Poin (kurang ${needed - currentPoints} Poin).`;
    redeemSubmitBtn.disabled = true;
  }
}

// Submit Tukar Poin
redeemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const memberCode = redeemMemberCode.value;
  const rewardVal = redeemRewardId.value;

  let payload = { member_code: memberCode };
  if (rewardVal === 'custom') {
    const customName = redeemCustomName.value.trim();
    const customCost = parseInt(redeemCustomPoints.value, 10);
    if (!customName || !customCost || customCost <= 0) {
      showToast('Lengkapi nama hadiah kustom dan jumlah poin.', 'error');
      return;
    }
    payload.custom_reward_name = customName;
    payload.points_spent = customCost;
  } else {
    payload.reward_id = parseInt(rewardVal, 10);
  }

  redeemSubmitBtn.disabled = true;
  redeemSubmitBtn.textContent = 'Memproses Penukaran...';

  try {
    const res = await fetch('/api/redemptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Gagal menukar poin.', 'error');
      return;
    }

    playBeepSound();
    const remainingPts = (data.member && data.member.current_points) !== undefined ? data.member.current_points : (data.remaining_points !== undefined ? data.remaining_points : 0);
    showToast(`Berhasil menukar: ${data.reward_name}! Sisa poin: ${remainingPts}`, 'success');

    redeemForm.reset();
    redeemCustomFields.style.display = 'none';
    redeemValidationNotice.style.display = 'none';

    await loadMembers();
    handleRedeemMemberChange();
    await loadRedeemHistory();
  } catch (err) {
    showToast('Terjadi kesalahan jaringan.', 'error');
  } finally {
    redeemSubmitBtn.textContent = 'Tukar Poin Sekarang';
    redeemSubmitBtn.disabled = true;
  }
});

// Tukar Poin Scanner Button
redeemOpenScannerBtn.addEventListener('click', () => {
  openCameraScanner((scannedCode) => {
    redeemMemberCode.value = scannedCode;
    if (redeemMemberCode.value !== scannedCode) {
      showToast(`Member dengan kode "${scannedCode}" tidak ditemukan.`, 'error');
      return;
    }
    handleRedeemMemberChange();
    showToast(`Member "${scannedCode}" berhasil dipilih!`, 'success');
  });
});

// Load Redemption History Table
async function loadRedeemHistory() {
  try {
    const res = await fetch('/api/redemptions');
    if (!res.ok) throw new Error();
    const list = await res.json();
    if (list.length === 0) {
      redeemHistoryTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">Belum ada riwayat penukaran poin.</td></tr>`;
      return;
    }

    redeemHistoryTableBody.innerHTML = list.map((item, idx) => `
      <tr>
        <td style="color:var(--text-muted);font-weight:600;">${idx + 1}</td>
        <td><strong style="color:var(--dark);">${escapeHtml(item.member_code)}</strong></td>
        <td><span style="font-weight:600;">${escapeHtml(item.full_name || '-')}</span></td>
        <td><span style="color:var(--dark);">${escapeHtml(item.reward_name)}</span></td>
        <td><span class="badge" style="background:#FFFBEB;color:#B45309;font-weight:700;">-${item.points_used !== undefined ? item.points_used : (item.points_spent || 0)} Poin</span></td>
        <td style="color:var(--text-muted);font-size:12.5px;">${formatDateTime(item.redeemed_at || item.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    redeemHistoryTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-light);">-</td></tr>`;
  }
}

// Reward CRUD Modal
openAddRewardModalBtn.addEventListener('click', () => {
  rewardModalTitle.textContent = 'Tambah Hadiah Baru';
  rewardModalSub.textContent = 'Masukkan nama hadiah dan poin yang dibutuhkan';
  rewardEditId.value = '';
  rewardForm.reset();
  rewardModal.classList.add('show');
});

closeRewardModalBtn.addEventListener('click', () => rewardModal.classList.remove('show'));
cancelRewardBtn.addEventListener('click', () => rewardModal.classList.remove('show'));
rewardModal.addEventListener('click', (e) => {
  if (e.target === rewardModal) rewardModal.classList.remove('show');
});

function openEditRewardModal(rewardId) {
  const r = allRewards.find(item => item.id === rewardId);
  if (!r) return;
  rewardModalTitle.textContent = 'Edit Hadiah';
  rewardModalSub.textContent = 'Perbarui nama hadiah atau ketentuan poin';
  rewardEditId.value = r.id;
  rewardName.value = r.reward_name;
  rewardPointsCost.value = r.points_cost;
  rewardDescription.value = r.description || '';
  rewardModal.classList.add('show');
}

rewardForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = rewardEditId.value;
  const payload = {
    reward_name: rewardName.value.trim(),
    points_cost: parseInt(rewardPointsCost.value, 10),
    description: rewardDescription.value.trim()
  };

  const submitBtn = document.getElementById('submitRewardBtn');
  submitBtn.disabled = true;

  try {
    const url = id ? `/api/rewards/${id}` : '/api/rewards';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Gagal menyimpan hadiah.', 'error');
      return;
    }
    showToast(data.message || 'Hadiah berhasil disimpan!', 'success');
    rewardModal.classList.remove('show');
    loadRewards();
  } catch (err) {
    showToast('Terjadi kesalahan server.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

async function deleteReward(rewardId, rewardName) {
  if (!confirm(`Hapus hadiah "${rewardName}" dari katalog?`)) return;
  try {
    const res = await fetch(`/api/rewards/${rewardId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.message || 'Gagal menghapus hadiah.', 'error');
      return;
    }
    showToast('Hadiah berhasil dihapus dari katalog.', 'success');
    loadRewards();
  } catch (err) {
    showToast('Terjadi kesalahan saat menghapus.', 'error');
  }
}

// ============================================================
// 5. Pure Clean Camera Barcode Scanner
// ============================================================
function openCameraScanner(callback) {
  activeScanCallback = callback;
  scannerModal.classList.add('show');
  startCameraStream();
}

async function startCameraStream() {
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Modul scanner kamera tidak tersedia.', 'error');
    return;
  }

  // Pure Camera Config (NO QRBOX to completely avoid boxed overlays or shaded regions)
  const config = {
    fps: 15,
    aspectRatio: 1.333334,
    disableFlip: false
  };

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode('scannerRegion');
    }

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
        () => {} // silent on frame pass
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
    console.warn('Camera access issue:', err);
    showToast('Kamera tidak dapat diakses langsung. Silakan gunakan Scan dari File Gambar.', 'alert');
  }
}

async function closeCameraScanner() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (e) {}
  }
  isScanning = false;
  scannerModal.classList.remove('show');
}

closeScannerModalBtn.addEventListener('click', closeCameraScanner);
scannerModal.addEventListener('click', (e) => {
  if (e.target === scannerModal) closeCameraScanner();
});

cameraSelect.addEventListener('change', async () => {
  if (isScanning && html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
    } catch (e) {}
    isScanning = false;
  }
  startCameraStream();
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

// Scan from image file fallback
scanFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const scanner = new Html5Qrcode('scannerRegion');
    const result = await scanner.scanFile(file, true);
    onScanSuccess(result);
  } catch (err) {
    showToast('Barcode tidak terdeteksi pada gambar yang diunggah.', 'error');
  } finally {
    scanFileInput.value = '';
  }
});

function onScanSuccess(decodedText) {
  playBeepSound();
  closeCameraScanner();
  const cleaned = decodedText.trim();
  if (activeScanCallback) {
    activeScanCallback(cleaned);
  }
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Initial App Boot
document.addEventListener('DOMContentLoaded', () => {
  // Ensure clean root URL
  if (window.location.pathname !== '/' || window.location.hash || window.location.search) {
    window.history.replaceState(null, '', window.location.origin);
  }
  loadMembers();
});
