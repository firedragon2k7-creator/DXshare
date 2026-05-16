// admin.js - Fixed Admin Tab Switching

async function showAdminDashboard() {
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    modal.show();
    loadAdminStats();
}

// 1. CHUYỂN TAB TRONG DASHBOARD (ĐÃ SỬA LỖI CHUYỂN TRANG)
function switchAdminTab(tabName, event) {
    event.preventDefault(); // NGĂN CHẶN HÀNH VI MẶC ĐỊNH CỦA THẺ A (CHUYỂN TRANG)

    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
    
    if (tabName === 'stats') {
        document.getElementById('adminTabStats').style.display = 'block';
        loadAdminStats();
    } else if (tabName === 'users') {
        document.getElementById('adminTabUsers').style.display = 'block';
        loadAdminUsers();
    } else if (tabName === 'docs') {
        document.getElementById('adminTabDocs').style.display = 'block';
        loadAdminDocs();
    }
    
    event.currentTarget.classList.add('active');
}

// 2. NẠP THỐNG KÊ
async function loadAdminStats() {
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        document.getElementById('statTotalUsers').innerText = data.totalUsers;
        document.getElementById('statTotalDocs').innerText = data.totalDocs;
        document.getElementById('statPendingDocs').innerText = data.pendingDocs;
    } catch (e) { console.error("Lỗi nạp thống kê"); }
}

// 3. QUẢN LÝ NGƯỜI DÙNG
async function loadAdminUsers() {
    const list = document.getElementById('adminUserList');
    try {
        const res = await fetch('/api/admin/users');
        const users = await res.json();
        list.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td class="fw-bold">${u.fullName || u.username}</td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">${u.role}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) { }
}

// 4. QUẢN LÝ TÀI LIỆU (DUYỆT/XÓA)
async function loadAdminDocs() {
    const list = document.getElementById('adminDocList');
    try {
        const res = await fetch('/api/admin/documents');
        const docs = await res.json();
        list.innerHTML = docs.map(d => `
            <tr>
                <td>
                    <div class="fw-bold text-dark">${d.title}</div>
                    <small class="text-muted">${d.description?.substring(0, 50)}...</small>
                </td>
                <td>${d.uploader?.fullName || d.uploader?.username}</td>
                <td><span class="badge ${d.status === 'PENDING' ? 'bg-warning' : d.status === 'APPROVED' ? 'bg-success' : 'bg-danger'}">${d.status}</span></td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-info text-white px-3" onclick="openPreview('${d.fileUrl}', '${d.title}', ${d.id})">
                            <i class="bi bi-eye-fill"></i> Xem
                        </button>
                        
                        ${d.status === 'PENDING' ? `
                            <button class="btn btn-sm btn-success px-3" onclick="updateDocStatus(${d.id}, 'APPROVED')">Duyệt</button>
                            <button class="btn btn-sm btn-danger px-3" onclick="updateDocStatus(${d.id}, 'REJECTED')">Từ chối</button>
                        ` : `
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteAdminDoc(${d.id})"><i class="bi bi-trash"></i> Xóa</button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (e) { }
}

async function updateDocStatus(id, status) {
    await fetch(`/api/admin/documents/${id}/status?status=${status}`, { method: 'PUT' });
    loadAdminDocs();
    loadAdminStats();
    if(typeof loadDocuments === 'function') loadDocuments();
}

async function deleteAdminDoc(id) {
    if(!confirm("Admin có chắc chắn muốn xóa tài liệu này?")) return;
    await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
    loadAdminDocs();
    loadAdminStats();
    if(typeof loadDocuments === 'function') loadDocuments();
}

async function deleteUser(id) {
    if(!confirm("Xóa người dùng này?")) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    loadAdminUsers();
    loadAdminStats();
}

async function deleteAdminReview(reviewId, docId) {
    if(!confirm("Admin chắc chắn muốn xóa bình luận này?")) return;
    try {
        const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
        if(res.ok) {
            if(typeof loadReviews === 'function') loadReviews(docId);
            alert("Đã xóa bình luận!");
        }
    } catch(e) { }
}
