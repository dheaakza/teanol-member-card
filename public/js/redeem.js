// State
let membersList = [];
let rewardsList = [];

// Elements
const memberSelect = document.getElementById('member_code');
const rewardSelect = document.getElementById('reward_id');
const customFields = document.getElementById('customRewardFields');
const customNameInput = document.getElementById('custom_reward_name');
const customPointsInput = document.getElementById('custom_points_cost');

const selectedMemberCard = document.getElementById('selectedMemberCard');
const smName = document.getElementById('smName');
const smCode = document.getElementById('smCode');
const smPoints = document.getElementById('smPoints');

const pointValidationNotice = document.getElementById('pointValidationNotice');
const redeemForm = document.getElementById('redeemForm');
const redeemSubmitBtn = document.getElementById('redeemSubmitBtn');

const rewardsGrid = document.getElementById('rewardsGrid');
const historyTableBody = document.getElementById('historyTableBody');

// Scanner Modal Elements
const openScannerBtn = document.getElementById('openScannerBtn');
const closeScannerModalBtn = document.getElementById('closeScannerModalBtn');
const scannerModal = document.getElementById('scannerModal');
const cameraSelect = document.getElementById('cameraSelect');
const barcodeFileInput = document.getElementById('barcodeFileInput');

// Add Reward Modal Elements
const addRewardModal = document.getElementById('addRewardModal');
const openAddRewardModalBtn = document.getElementById('openAddRewardModalBtn');
const closeAddRewardModalBtn = document.getElementById('closeAddRewardModalBtn');
const cancelAddRewardBtn = document.getElementById('cancelAddRewardBtn');
const addRewardForm = document.getElementById('addRewardForm');

// Edit Reward Modal Elements
const editRewardModal = document.getElementById('editRewardModal');
const closeEditRewardModalBtn = document.getElementById('closeEditRewardModalBtn');
const cancelEditRewardBtn = document.getElementById('cancelEditRewardBtn');
const editRewardForm = document.getElementById('editRewardForm');
const editRewardIdInput = document.getElementById('edit_reward_id');
const editRewardNameInput = document.getElementById('edit_reward_name');
const editPointsCostInput = document.getElementById('edit_points_cost');

let html5QrCode = null;
let isScanning = false;

// Modal Add Reward Handlers
openAddRewardModalBtn.addEventListener('click', () => {
  addRewardForm.reset();
  addRewardModal.classList.add('show');
});

closeAddRewardModalBtn.addEventListener('click', () => addRewardModal.classList.remove('show'));
cancelAddRewardBtn.addEventListener('click', () => addRewardModal.classList.remove('show'));
addRewardModal.addEventListener('click', (e) => {
  if (e.target === addRewardModal) addRewardModal.classList.remove('show');
});

// Modal Edit Reward Handlers
closeEditRewardModalBtn.addEventListener('click', () => editRewardModal.classList.remove('show'));
cancelEditRewardBtn.addEventListener('click', () => editRewardModal.classList.remove('show'));
editRewardModal.addEventListener('click', (e) => {
  if (e.target === editRewardModal) editRewardModal.classList.remove('show');
});

// Member Selection
function selectMemberByCode(code) {
  if (!code) {
    selectedMemberCard.style.display = 'none';
    checkPointsSufficiency();
    return;
  }
  const found = membersList.find(m => m.member_code === code);
  if (found) {
    memberSelect.value = code;
    smName.textContent = found.full_name;
    smCode.textContent = found.member_code;
    smPoints.textContent = `${found.points} Poin`;
    selectedMemberCard.style.display = 'block';
    playBeepSound();
    checkPointsSufficiency();
    showToast(`Member terpilih: ${found.full_name}`, 'success');
  } else {
    showToast(`ID Member "${code}" tidak ditemukan.`, 'error');
  }
}

memberSelect.addEventListener('change', () => {
  selectMemberByCode(memberSelect.value);
});

// Check Points Sufficiency
function checkPointsSufficiency() {
  const memberCode = memberSelect.value;
  const rewardVal = rewardSelect.value;

  if (!memberCode || !rewardVal) {
    pointValidationNotice.style.display = 'none';
    redeemSubmitBtn.disabled = false;
    return;
  }

  const member = membersList.find(m => m.member_code === memberCode);
  if (!member) return;

  let cost = 0;
  if (rewardVal === 'custom') {
    cost = parseInt(customPointsInput.value, 10) || 0;
  } else {
    const rew = rewardsList.find(r => String(r.id) === rewardVal);
    cost = rew ? rew.points_cost : 0;
  }

  if (cost <= 0) {
    pointValidationNotice.style.display = 'none';
    redeemSubmitBtn.disabled = false;
    return;
  }

  if (member.points >= cost) {
    pointValidationNotice.style.display = 'block';
    pointValidationNotice.style.background = '#ECFDF5';
    pointValidationNotice.style.color = '#065F46';
    pointValidationNotice.style.border = '1px solid #A7F3D0';
    pointValidationNotice.innerHTML = `<span style="font-weight:700;">Poin mencukupi.</span> Sisa poin setelah penukaran: <strong>${member.points - cost} poin</strong>.`;
    redeemSubmitBtn.disabled = false;
    redeemSubmitBtn.classList.remove('secondary');
    redeemSubmitBtn.classList.add('primary');
  } else {
    pointValidationNotice.style.display = 'block';
    pointValidationNotice.style.background = '#FEF2F2';
    pointValidationNotice.style.color = '#991B1B';
    pointValidationNotice.style.border = '1px solid #FECACA';
    pointValidationNotice.innerHTML = `<span style="font-weight:700;">Poin tidak mencukupi.</span> Dibutuhkan <strong>${cost} poin</strong>, saldo member saat ini: <strong>${member.points} poin</strong> (kurang ${cost - member.points} poin).`;
    redeemSubmitBtn.disabled = true;
    redeemSubmitBtn.classList.remove('primary');
    redeemSubmitBtn.classList.add('secondary');
  }
}

rewardSelect.addEventListener('change', () => {
  customFields.style.display = rewardSelect.value === 'custom' ? 'block' : 'none';
  checkPointsSufficiency();
});

customPointsInput.addEventListener('input', checkPointsSufficiency);

// Scanner Modal Controls
async function openScanner() {
  scannerModal.classList.add('show');
  if (typeof Html5Qrcode === 'undefined') {
    showToast('Pustaka scanner belum siap.', 'error');
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
    showToast('Tidak bisa mengakses kamera.', 'error');
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

// Load Members
async function loadMembers(preselectCode) {
  try {
    const res = await fetch('/api/members');
    membersList = await res.json();

    if (membersList.length === 0) {
      memberSelect.innerHTML = '<option value="">-- Belum ada member terdaftar --</option>';
      return;
    }

    memberSelect.innerHTML = '<option value="">-- Pilih Member --</option>' +
      membersList.map(m => `<option value="${m.member_code}">${m.member_code} &mdash; ${m.full_name} (${m.points} poin)</option>`).join('');

    if (preselectCode) {
      selectMemberByCode(preselectCode);
    }
  } catch (err) {
    memberSelect.innerHTML = '<option value="">-- Gagal memuat data member --</option>';
  }
}

// Load Rewards Catalog (Read)
async function loadRewards() {
  try {
    const res = await fetch('/api/rewards');
    rewardsList = await res.json();

    // Dropdown
    rewardSelect.innerHTML = '<option value="">-- Pilih Hadiah --</option>' +
      rewardsList.map(r => `<option value="${r.id}">${r.reward_name} (${r.points_cost} poin)</option>`).join('') +
      '<option value="custom">Hadiah Kustom (Isi Nama & Poin Manual)</option>';

    // Visual Cards Grid with Edit & Delete actions
    if (rewardsList.length === 0) {
      rewardsGrid.innerHTML = '<p style="color:var(--text-muted);padding:12px;">Belum ada hadiah di katalog.</p>';
      return;
    }

    rewardsGrid.innerHTML = rewardsList.map(r => `
      <div class="reward-card">
        <div>
          <div class="reward-card-top">
            <span class="cost-badge">${r.points_cost} Poin</span>
            <div style="display:flex;gap:4px;">
              <button type="button" class="btn secondary sm icon-btn" title="Edit Hadiah" onclick="openEditRewardModal(${r.id})">
                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button type="button" class="btn danger sm icon-btn" title="Hapus Hadiah" onclick="deleteReward(${r.id})">
                <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          <div class="title">${r.reward_name}</div>
        </div>
        <button type="button" class="btn secondary sm" style="width:100%;margin-top:10px;" onclick="pickReward(${r.id})">
          Tukar Hadiah Ini
        </button>
      </div>
    `).join('');
  } catch (err) {
    rewardsGrid.innerHTML = '<p style="color:var(--danger);padding:12px;">Gagal memuat katalog hadiah.</p>';
  }
}

window.pickReward = function(id) {
  rewardSelect.value = String(id);
  customFields.style.display = 'none';
  checkPointsSufficiency();
  window.scrollTo({ top: 120, behavior: 'smooth' });
  showToast(`Hadiah dipilih dari katalog.`, 'success');
};

// Open Edit Reward Modal
window.openEditRewardModal = function(id) {
  const reward = rewardsList.find(r => r.id === id);
  if (!reward) return;

  editRewardIdInput.value = reward.id;
  editRewardNameInput.value = reward.reward_name;
  editPointsCostInput.value = reward.points_cost;

  editRewardModal.classList.add('show');
};

// Edit Reward Form Submit (Update)
editRewardForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = editRewardIdInput.value;
  const reward_name = editRewardNameInput.value.trim();
  const points_cost = parseInt(editPointsCostInput.value, 10);

  if (!reward_name || !points_cost || points_cost <= 0) {
    showToast('Isi data hadiah dengan benar.', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/rewards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reward_name, points_cost })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Gagal memperbarui hadiah.', 'error');
      return;
    }

    showToast('Hadiah berhasil diperbarui!', 'success');
    editRewardModal.classList.remove('show');
    loadRewards();
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
});

// Delete Reward (Delete)
window.deleteReward = async function(id) {
  if (!confirm('Apakah Anda yakin ingin menonaktifkan/menghapus hadiah ini dari katalog?')) return;

  try {
    const res = await fetch(`/api/rewards/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message || 'Hadiah dinonaktifkan.', 'success');
      loadRewards();
    } else {
      showToast(data.message || 'Gagal menghapus hadiah.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
};

// Create Reward (Create)
addRewardForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const reward_name = document.getElementById('new_reward_name').value.trim();
  const points_cost = parseInt(document.getElementById('new_points_cost').value, 10);

  try {
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reward_name, points_cost })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Gagal menambahkan hadiah.', 'error');
      return;
    }

    showToast('Hadiah baru berhasil ditambahkan ke katalog!', 'success');
    addRewardModal.classList.remove('show');
    addRewardForm.reset();
    loadRewards();
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
});

// Load History
async function loadHistory() {
  try {
    const res = await fetch('/api/redemptions');
    const history = await res.json();

    if (history.length === 0) {
      historyTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">Belum ada riwayat penukaran poin.</td></tr>';
      return;
    }

    historyTableBody.innerHTML = history.map((h, i) => `
      <tr>
        <td style="color:var(--text-muted);">${i + 1}</td>
        <td><strong>${h.member_code}</strong></td>
        <td>${h.full_name}</td>
        <td><strong style="color:var(--dark);">${h.reward_name}</strong></td>
        <td><span class="badge points">-${h.points_used} Poin</span></td>
        <td>${formatDateTime(h.redeemed_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    historyTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--danger);">Gagal memuat riwayat.</td></tr>';
  }
}

// Redeem Submit
redeemForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const member_code = memberSelect.value;
  const reward_id = rewardSelect.value;

  if (!member_code) {
    showToast('Silakan pilih member terlebih dahulu.', 'error');
    return;
  }
  if (!reward_id) {
    showToast('Silakan pilih hadiah.', 'error');
    return;
  }

  const payload = { member_code };

  if (reward_id === 'custom') {
    const name = customNameInput.value.trim();
    const cost = parseInt(customPointsInput.value, 10);
    if (!name || !cost || cost <= 0) {
      showToast('Isi nama hadiah dan jumlah poin kustom dengan benar.', 'error');
      return;
    }
    payload.reward_name = name;
    payload.points_cost = cost;
  } else {
    payload.reward_id = reward_id;
  }

  try {
    const res = await fetch('/api/redemptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Gagal menukarkan poin.', 'error');
      return;
    }

    playBeepSound();
    showToast(`Penukaran berhasil! Sisa poin: ${data.remaining_points} poin.`, 'success');

    redeemForm.reset();
    customFields.style.display = 'none';
    pointValidationNotice.style.display = 'none';

    await loadMembers(data.member_code);
    loadHistory();
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
});

// Inisialisasi
const urlParams = new URLSearchParams(window.location.search);
loadMembers(urlParams.get('member_code'));
loadRewards();
loadHistory();
