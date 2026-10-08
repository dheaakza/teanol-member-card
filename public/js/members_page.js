// State
let allMembers = [];

// Elements
const memberTableBody = document.getElementById('memberTableBody');
const searchInput = document.getElementById('searchInput');
const totalMembers = document.getElementById('totalMembers');
const totalThisMonth = document.getElementById('totalThisMonth');
const totalPoints = document.getElementById('totalPoints');

// Modal Add Member
const addMemberModal = document.getElementById('addMemberModal');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeAddModalBtn = document.getElementById('closeAddModalBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const addMemberForm = document.getElementById('addMemberForm');
const regJoinDate = document.getElementById('reg_join_date');

// Modal Detail Member
const detailMemberModal = document.getElementById('detailMemberModal');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
const detName = document.getElementById('detName');
const detCode = document.getElementById('detCode');
const detPointsBadge = document.getElementById('detPointsBadge');
const detBarcodeImg = document.getElementById('detBarcodeImg');
const detBarcodeLabel = document.getElementById('detBarcodeLabel');
const detPhone = document.getElementById('detPhone');
const detJoinDate = document.getElementById('detJoinDate');
const detEmail = document.getElementById('detEmail');
const detAddress = document.getElementById('detAddress');
const detWaBtn = document.getElementById('detWaBtn');
const detBuyBtn = document.getElementById('detBuyBtn');
const detRedeemBtn = document.getElementById('detRedeemBtn');
const detPdfBtn = document.getElementById('detPdfBtn');
const detHistoryContainer = document.getElementById('detHistoryContainer');

// Set default join date to today
if (regJoinDate) {
  regJoinDate.value = new Date().toISOString().split('T')[0];
}

// Modal open/close handlers
openAddModalBtn.addEventListener('click', () => {
  addMemberForm.reset();
  regJoinDate.value = new Date().toISOString().split('T')[0];
  addMemberModal.classList.add('show');
});

closeAddModalBtn.addEventListener('click', () => addMemberModal.classList.remove('show'));
cancelAddBtn.addEventListener('click', () => addMemberModal.classList.remove('show'));
addMemberModal.addEventListener('click', (e) => {
  if (e.target === addMemberModal) addMemberModal.classList.remove('show');
});

closeDetailModalBtn.addEventListener('click', () => detailMemberModal.classList.remove('show'));
detailMemberModal.addEventListener('click', (e) => {
  if (e.target === detailMemberModal) detailMemberModal.classList.remove('show');
});

// Render Member Table
function renderMembers(list) {
  if (list.length === 0) {
    memberTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">
          Tidak ada member yang cocok dengan pencarian.
        </td>
      </tr>
    `;
    return;
  }

  memberTableBody.innerHTML = list.map((m, idx) => `
    <tr>
      <td style="color:var(--text-muted);font-weight:600;">${idx + 1}</td>
      <td>
        <span style="font-weight:700;color:var(--dark);letter-spacing:0.5px;">${m.member_code}</span>
      </td>
      <td>
        <span style="font-weight:600;color:var(--dark);">${m.full_name}</span>
      </td>
      <td>${m.phone || '<span style="color:var(--text-light);">-</span>'}</td>
      <td>${formatDate(m.join_date)}</td>
      <td>
        <span class="badge points">${m.points || 0} Poin</span>
      </td>
      <td style="text-align:right;">
        <div style="display:flex;gap:6px;justify-content:flex-end;">
          <button type="button" class="btn secondary sm icon-btn" title="Lihat Detail & Barcode" onclick="openDetailByCode('${m.member_code}')">
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button type="button" class="btn danger sm icon-btn" title="Hapus Member" onclick="deleteMember(${m.id})">
            <svg class="icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Fetch Members from API
async function fetchMembers() {
  try {
    const res = await fetch('/api/members');
    allMembers = await res.json();

    // Stats
    totalMembers.textContent = allMembers.length;

    const now = new Date();
    const thisMonth = allMembers.filter(m => {
      const d = new Date(m.join_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    totalThisMonth.textContent = thisMonth;

    const totalPts = allMembers.reduce((sum, m) => sum + (m.points || 0), 0);
    totalPoints.textContent = totalPts;

    renderMembers(allMembers);
  } catch (err) {
    showToast('Gagal memuat data member dari server.', 'error');
  }
}

// Search Filter
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  if (!query) {
    renderMembers(allMembers);
    return;
  }
  const filtered = allMembers.filter(m =>
    m.full_name.toLowerCase().includes(query) ||
    m.member_code.toLowerCase().includes(query) ||
    (m.phone && m.phone.includes(query))
  );
  renderMembers(filtered);
});

// Open Detail Modal
window.openDetailByCode = async function(code) {
  const member = allMembers.find(m => m.member_code === code);
  if (!member) return;

  detName.textContent = member.full_name;
  detCode.textContent = member.member_code;
  detPointsBadge.textContent = `${member.points || 0} Poin`;
  detBarcodeLabel.textContent = member.member_code;
  detBarcodeImg.src = `/api/members/barcode/${encodeURIComponent(member.member_code)}`;

  detPhone.textContent = member.phone || '-';
  detJoinDate.textContent = formatDate(member.join_date);
  detEmail.textContent = member.email || '-';
  detAddress.textContent = member.address || '-';

  // Action links
  if (member.phone) {
    let cleanPhone = member.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    detWaBtn.href = `https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(member.full_name)},%20terima%20kasih%20telah%20menjadi%20member%20TEANOL!%20Poin%20kamu%20saat%20ini:%20${member.points || 0}%20poin.`;
    detWaBtn.style.display = 'inline-flex';
  } else {
    detWaBtn.style.display = 'none';
  }

  detBuyBtn.href = `/purchase.html?member_code=${encodeURIComponent(member.member_code)}`;
  detRedeemBtn.href = `/redeem.html?member_code=${encodeURIComponent(member.member_code)}`;

  if (member.card_pdf_path) {
    detPdfBtn.href = member.card_pdf_path;
    detPdfBtn.style.display = 'inline-flex';
  } else {
    detPdfBtn.style.display = 'none';
  }

  // Load History
  detHistoryContainer.innerHTML = 'Memuat riwayat transaksi...';
  try {
    const res = await fetch(`/api/members/history/${encodeURIComponent(member.member_code)}`);
    const history = await res.json();

    let historyHtml = '';

    if (history.purchases && history.purchases.length > 0) {
      historyHtml += '<div style="margin-bottom:10px;"><strong>Pembelian Terakhir:</strong><ul style="padding-left:18px;margin-top:4px;">';
      history.purchases.slice(0, 3).forEach(p => {
        historyHtml += `<li>${p.quantity}x ${p.product_name} (<span style="color:var(--success);font-weight:600;">+${p.points_earned} poin</span>) &middot; <span style="color:var(--text-light);">${formatDateTime(p.purchase_date)}</span></li>`;
      });
      historyHtml += '</ul></div>';
    }

    if (history.redemptions && history.redemptions.length > 0) {
      historyHtml += '<div><strong>Penukaran Poin Terakhir:</strong><ul style="padding-left:18px;margin-top:4px;">';
      history.redemptions.slice(0, 3).forEach(r => {
        historyHtml += `<li>Tukar: ${r.reward_name} (<span style="color:var(--danger);font-weight:600;">-${r.points_used} poin</span>) &middot; <span style="color:var(--text-light);">${formatDateTime(r.redeemed_at)}</span></li>`;
      });
      historyHtml += '</ul></div>';
    }

    if (!historyHtml) {
      historyHtml = '<em>Belum ada transaksi tercatat untuk member ini.</em>';
    }

    detHistoryContainer.innerHTML = historyHtml;
  } catch (err) {
    detHistoryContainer.innerHTML = '<em>Gagal memuat riwayat transaksi.</em>';
  }

  detailMemberModal.classList.add('show');
};

// Form Pendaftaran Submit
addMemberForm.addEventListener('submit', async (e) => {
  e.preventDefault();

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

    playBeepSound();
    showToast(`Member berhasil didaftarkan! ID: ${data.member_code}`, 'success');
    addMemberModal.classList.remove('show');
    addMemberForm.reset();

    await fetchMembers();

    // Buka detail modal untuk langsung melihat barcode & unduh kartu
    openDetailByCode(data.member_code);
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
});

// Delete Member
async function deleteMember(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus member ini?')) return;

  try {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok) {
      showToast(data.message || 'Member berhasil dihapus.', 'success');
      fetchMembers();
    } else {
      showToast(data.message || 'Gagal menghapus member.', 'error');
    }
  } catch (err) {
    showToast('Gagal terhubung ke server.', 'error');
  }
}

// Keep recap.html pointing to this clean experience
fetchMembers();
