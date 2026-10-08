const tableBody = document.getElementById('tableBody');
const totalMembers = document.getElementById('totalMembers');
const totalThisMonth = document.getElementById('totalThisMonth');
const totalPoints = document.getElementById('totalPoints');
const searchInput = document.getElementById('searchInput');

const memberModal = document.getElementById('memberModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCode = document.getElementById('modalCode');
const modalName = document.getElementById('modalName');
const modalBarcodeImg = document.getElementById('modalBarcodeImg');
const modalPoints = document.getElementById('modalPoints');
const modalJoin = document.getElementById('modalJoin');
const modalPhone = document.getElementById('modalPhone');
const modalEmail = document.getElementById('modalEmail');
const modalAddress = document.getElementById('modalAddress');
const modalBuyLink = document.getElementById('modalBuyLink');
const modalRedeemLink = document.getElementById('modalRedeemLink');
const modalPdfLink = document.getElementById('modalPdfLink');

let allMembers = [];

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showMemberDetail(member) {
  modalCode.textContent = member.member_code;
  modalName.textContent = member.full_name;
  modalBarcodeImg.src = `/api/members/barcode/${encodeURIComponent(member.member_code)}`;
  modalPoints.textContent = member.points || 0;
  modalJoin.textContent = formatDate(member.join_date);
  modalPhone.textContent = member.phone || '-';
  modalEmail.textContent = member.email || '-';
  modalAddress.textContent = member.address || '-';

  modalBuyLink.href = `/purchase.html?member_code=${encodeURIComponent(member.member_code)}`;
  modalRedeemLink.href = `/redeem.html?member_code=${encodeURIComponent(member.member_code)}`;

  if (member.card_pdf_path) {
    modalPdfLink.href = member.card_pdf_path;
    modalPdfLink.style.display = 'inline-flex';
  } else {
    modalPdfLink.style.display = 'none';
  }

  memberModal.classList.add('show');
}

modalCloseBtn.addEventListener('click', () => {
  memberModal.classList.remove('show');
});

memberModal.addEventListener('click', (e) => {
  if (e.target === memberModal) {
    memberModal.classList.remove('show');
  }
});

function renderTable(membersToRender) {
  if (membersToRender.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Tidak ada member ditemukan.</td></tr>';
    return;
  }

  tableBody.innerHTML = membersToRender.map((m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <a href="#" class="action-link" style="color:var(--teanol-dark);" onclick="openDetailByCode('${m.member_code}'); return false;">
          <strong>${m.member_code}</strong>
        </a>
      </td>
      <td>${m.full_name}</td>
      <td>${m.phone || '-'}</td>
      <td>${formatDate(m.join_date)}</td>
      <td><strong style="color:#1e6b0d;">${m.points || 0}</strong></td>
      <td>
        <button type="button" class="scan-btn" style="padding:4px 10px;margin-bottom:0;font-size:12px;" onclick="openDetailByCode('${m.member_code}')">
          <svg class="icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="5" x2="3" y2="19"></line><line x1="7" y1="5" x2="7" y2="19"></line><line x1="11" y1="5" x2="11" y2="19"></line><line x1="15" y1="5" x2="15" y2="19"></line><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          Barcode
        </button>

      </td>
      <td>
        ${m.card_pdf_path ? `<a class="action-link" href="${m.card_pdf_path}" target="_blank">PDF</a>` : ''}
        <a href="#" class="action-link danger" onclick="deleteMember(${m.id}); return false;">Hapus</a>
      </td>
    </tr>
  `).join('');
}

window.openDetailByCode = function(code) {
  const found = allMembers.find(m => m.member_code === code);
  if (found) {
    showMemberDetail(found);
  }
};

async function loadMembers() {
  try {
    const res = await fetch('/api/members');
    allMembers = await res.json();

    totalMembers.textContent = allMembers.length;

    const now = new Date();
    const thisMonthCount = allMembers.filter(m => {
      const jd = new Date(m.join_date);
      return jd.getMonth() === now.getMonth() && jd.getFullYear() === now.getFullYear();
    }).length;
    totalThisMonth.textContent = thisMonthCount;

    const pointsSum = allMembers.reduce((sum, m) => sum + (m.points || 0), 0);
    totalPoints.textContent = pointsSum;

    renderTable(allMembers);
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="8">Gagal memuat data. Pastikan server berjalan.</td></tr>';
  }
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  if (!query) {
    renderTable(allMembers);
    return;
  }
  const filtered = allMembers.filter(m =>
    m.full_name.toLowerCase().includes(query) ||
    m.member_code.toLowerCase().includes(query) ||
    (m.phone && m.phone.includes(query))
  );
  renderTable(filtered);
});

async function deleteMember(id) {
  if (!confirm('Yakin ingin menghapus member ini?')) return;
  try {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadMembers();
    } else {
      alert('Gagal menghapus member.');
    }
  } catch (err) {
    alert('Gagal terhubung ke server.');
  }
}

loadMembers();
