// main.js - Optimized Admin Review Deletion

if (typeof CLOUD_NAME === 'undefined') {
    var CLOUD_NAME = 'dvywhicrc';
    var UPLOAD_PRESET = 'ml_default';
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDocuments();
});

async function loadDocuments() {
    const container = document.getElementById('documentContainer');
    if (!container) return;
    try {
        const res = await fetch('/api/documents');
        if (!res.ok) throw new Error("Lỗi Server");
        const allDocs = await res.json();
        renderDocuments(allDocs);
    } catch(e) { container.innerHTML = "<p class='text-center py-5 text-danger'>Lỗi kết nối Server!</p>"; }
}

function renderDocuments(docs) {
    const container = document.getElementById('documentContainer');
    const currentUser = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');

    container.innerHTML = docs.map(doc => {
        const uploader = doc.uploader || {};
        const uploaderName = uploader.fullName || uploader.username || 'Sinh viên VKU';
        const isOwner = (currentUser && uploader.username === currentUser) || userRole === 'ADMIN';
        
        let avatarBase = (currentUser && uploader.username === currentUser) ? (localStorage.getItem('userAvatar') || uploader.avatarUrl) : uploader.avatarUrl;
        let finalAvatar = (!avatarBase || avatarBase === "null") 
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(uploaderName)}&background=random&color=fff`
            : avatarBase;

        const reviews = doc.reviews || [];
        const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) starsHtml += i <= Math.round(avgRating) ? '<i class="bi bi-star-fill text-warning me-1"></i>' : '<i class="bi bi-star text-muted me-1"></i>';

        return `
        <div class="col-md-4 mb-4" id="doc-card-${doc.id}">
            <div class="card card-doc shadow-sm">
                <div class="card-body">
                    <div class="uploader-info">
                        <img src="${finalAvatar}" class="uploader-avatar">
                        <div class="d-flex flex-column">
                            <span class="fw-bold text-dark small">${uploaderName}</span>
                            <div class="stars-small">${starsHtml} <span class="text-muted ms-1">(${avgRating})</span></div>
                        </div>
                    </div>
                    <h5 class="doc-title">${doc.title}</h5>
                    <p class="doc-desc">${doc.description || 'Tài liệu VKU'}</p>
                    <div class="doc-footer">
                        <button onclick="openPreview('${doc.fileUrl}', '${doc.title}', ${doc.id})" class="btn-doc btn-doc-view">Xem</button>
                        <a href="${doc.fileUrl}" target="_blank" download class="btn-doc btn-doc-dl text-decoration-none text-dark">Tải</a>
                        ${isOwner ? `<button onclick="deleteDoc(${doc.id})" class="btn-doc btn-doc-delete"><i class="bi bi-trash3-fill"></i></button>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

async function loadReviews(docId) {
    const reviewList = document.getElementById('reviewList');
    const userRole = localStorage.getItem('userRole');
    if (!reviewList) return;
    try {
        const res = await fetch(`/api/documents/${docId}`);
        const docData = await res.json();
        const reviews = docData.reviews || [];
        if (reviews.length > 0) {
            reviewList.innerHTML = reviews.map(r => {
                const reviewerName = r.user?.fullName || r.user?.username || 'Sinh viên';
                const rAvatar = r.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=random&color=fff`;
                let rStars = '';
                for(let i=1; i<=5; i++) rStars += i <= r.rating ? '<i class="bi bi-star-fill text-warning" style="font-size:0.6rem"></i>' : '<i class="bi bi-star text-muted" style="font-size:0.6rem"></i>';
                
                return `
                <div class="review-item d-flex align-items-start p-2 mb-2 shadow-sm" style="background:#fff; border-radius:12px;">
                    <img src="${rAvatar}" class="rounded-circle me-2 border" width="30" height="30" style="object-fit:cover;">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold small" style="color:var(--vku-navy);">${reviewerName}</span>
                            <div class="d-flex align-items-center">
                                <div>${rStars}</div>
                                ${userRole === 'ADMIN' ? `<button onclick="deleteAdminReview(${r.id}, ${docId})" class="btn btn-link text-danger p-0 ms-2"><i class="bi bi-x-circle-fill"></i></button>` : ''}
                            </div>
                        </div>
                        <p class="small text-muted mb-0" style="font-size:0.75rem;">${r.comment || 'Hay!'}</p>
                    </div>
                </div>`;
            }).join('');
        } else { reviewList.innerHTML = '<p class="text-muted small text-center mt-5 opacity-50">Chưa có đánh giá.</p>'; }
    } catch(e) { }
}

// CẦN ĐẢM BẢO HÀM NÀY NẰM Ở WINDOW ĐỂ NÚT BẤM CÓ THỂ GỌI ĐƯỢC
window.deleteAdminReview = async function(reviewId, docId) {
    if(!confirm("Xác nhận xóa bình luận?")) return;
    try {
        const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
        if(res.ok) {
            alert("Đã xóa bình luận thành công!");
            loadReviews(docId); // Nạp lại danh sách
            loadDocuments(); // Cập nhật sao trung bình
        } else {
            const msg = await res.text();
            alert("Lỗi từ Server: " + msg);
        }
    } catch(e) { alert("Lỗi kết nối!"); }
}

async function openPreview(url, title, docId) {
    currentDocId = docId;
    const modalElem = document.getElementById('previewModal');
    const frame = document.getElementById('previewFrame');
    if (!modalElem || !frame) return;
    document.getElementById('previewTitle').innerText = title;
    loadReviews(docId);
    frame.src = url.startsWith('http') ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : url;
    const dlBtn = document.getElementById('downloadBtnInModal');
    if(dlBtn) dlBtn.onclick = () => window.open(url, '_blank');
    bootstrap.Modal.getOrCreateInstance(modalElem).show();
}

let currentRating = 0;
let currentDocId = null;
document.addEventListener('click', (e) => {
    if (e.target.matches('#starRating i')) {
        currentRating = e.target.getAttribute('data-value');
        updateStars(currentRating);
    }
});
function updateStars(rating) {
    document.querySelectorAll('#starRating i').forEach(star => {
        const val = star.getAttribute('data-value');
        star.className = val <= rating ? 'bi bi-star-fill' : 'bi bi-star';
    });
}

async function submitReview() {
    const comment = document.getElementById('reviewComment').value;
    const currentUser = localStorage.getItem('user');
    if (!currentUser || currentUser === "null") return alert("Đăng nhập để đánh giá!");
    if (!currentDocId || currentRating === 0) return alert("Chọn số sao!");
    try {
        const res = await fetch(`/api/documents/${currentDocId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: parseInt(currentRating), comment: comment, username: currentUser })
        });
        if (res.ok) { document.getElementById('reviewComment').value = ''; updateStars(0); loadReviews(currentDocId); loadDocuments(); }
    } catch (err) { }
}

async function deleteDoc(id) {
    if (!confirm("Xóa tài liệu này?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) document.getElementById(`doc-card-${id}`)?.remove();
}

function showUserInfo(name, avatar, email) {
    const modalElem = document.getElementById('userProfileModal');
    if (!modalElem) return;
    document.getElementById('userModalName').innerText = name;
    document.getElementById('userModalEmail').innerText = email;
    document.getElementById('userModalAvatar').src = avatar;
    bootstrap.Modal.getOrCreateInstance(modalElem).show();
}

async function loadMyDocuments() {
    const currentUser = localStorage.getItem('user');
    if(!currentUser) return alert("Đăng nhập đã nhé!");
    const res = await fetch('/api/documents');
    const allDocs = await res.json();
    const myDocs = allDocs.filter(doc => (doc.uploader?.username === currentUser));
    if(myDocs.length > 0) { renderDocuments(myDocs); bootstrap.Modal.getInstance(document.getElementById('userProfileModal'))?.hide(); }
}
