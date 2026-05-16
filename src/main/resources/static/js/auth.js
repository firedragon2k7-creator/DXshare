// auth.js - Synced with Admin Role

function checkAuth() {
    const userFullName = localStorage.getItem('userFullName');
    const username = localStorage.getItem('user');
    const avatar = localStorage.getItem('userAvatar');
    const email = localStorage.getItem('userEmail') || 'sinhvien@vku.udn.vn';
    const authSec = document.getElementById('authSection');
    const uploadBtn = document.getElementById('uploadBtn');
    const adminLink = document.getElementById('adminLink');

    if (!authSec) return;

    if (username && username !== "null") {
        if (uploadBtn) uploadBtn.style.display = 'block';

        // KIỂM TRA ROLE ĐỂ HIỆN NÚT ADMIN
        const userRole = localStorage.getItem('userRole');
        if (adminLink && userRole === 'ADMIN') adminLink.style.display = 'block';

        const displayName = (userFullName && userFullName !== "null") ? userFullName : username;
        let avatarSrc = (avatar && avatar !== "null" && avatar.length > 5) ? avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=004085&color=fff&bold=true`;

        authSec.innerHTML = `
            <div class="d-flex align-items-center" style="cursor: pointer;" onclick="showUserInfo('${displayName}', '${avatarSrc}', '${email}')">
                <div class="me-3 text-white d-flex align-items-center">
                    <img src="${avatarSrc}" class="rounded-circle me-2 border border-2 border-white shadow-sm" width="38" height="38" style="object-fit: cover;">
                    <span class="fw-bold text-white">${displayName}</span>
                </div>
                <button onclick="event.stopPropagation(); logout();" class="btn btn-sm btn-outline-light rounded-pill px-3 ms-2">Đăng xuất</button>
            </div>`;
    } else {
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        authSec.innerHTML = `<button class="btn btn-outline-light btn-sm rounded-pill px-4 fw-bold shadow-sm" data-bs-toggle="modal" data-bs-target="#authModal">ĐĂNG NHẬP</button>`;
    }
}

async function handleLogin() {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('user', data.username);
            localStorage.setItem('userFullName', data.fullName || '');
            localStorage.setItem('userRole', data.role || 'STUDENT'); // LƯU VAI TRÒ
            localStorage.setItem('userEmail', data.email || '');
            localStorage.setItem('userAvatar', data.avatarUrl || '');
            location.reload();
        } else { alert("Sai tài khoản!"); }
    } catch (err) { alert("Lỗi kết nối!"); }
}

async function handleUpload() {
    const fileInput = document.getElementById('fileInput');
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('description');
    const errorDiv = document.getElementById('uploadErrorDisplay');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');

    if (!fileInput || !fileInput.files[0]) return alert("Chọn file!");
    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) return alert("File quá 10MB!");

    try {
        progressContainer.style.display = 'block';
        progressBar.style.width = '50%';

        const cloudData = new FormData();
        cloudData.append("file", file);
        cloudData.append("upload_preset", "ml_default");
        cloudData.append("cloud_name", "dvywhicrc");

        const cloudRes = await fetch("https://api.cloudinary.com/v1_1/dvywhicrc/upload", { method: "POST", body: cloudData });
        const cloudResult = await cloudRes.json();

        const res = await fetch('/api/documents/upload-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titleInput.value, description: descInput.value, fileUrl: cloudResult.secure_url, uploaderName: localStorage.getItem('user') })
        });

        if (res.ok) { alert("Tải lên thành công! Đang chờ Admin duyệt."); location.reload(); }
    } catch (e) { alert("Lỗi!"); }
}

async function handleRegister() {
    const fullName = document.getElementById('regFullName').value;
    const username = document.getElementById('regUser').value;
    const password = document.getElementById('regPass').value;
    const email = document.getElementById('regEmail').value;
    const otp = document.getElementById('regOtp').value;
    try {
        const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password, fullName, otp }) });
        if (res.ok) { alert("Đăng ký thành công!"); toggleAuthPanel('signIn'); }
        else { alert("Lỗi đăng ký!"); }
    } catch (err) { }
}

async function sendOtp() {
    const email = document.getElementById('regEmail').value;
    if(!email) return alert("Nhập Email!");
    await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    alert("OTP đã gửi!");
}

function toggleAuthPanel(mode) {
    const container = document.getElementById('authBox');
    if (mode === 'signUp') container.classList.add("right-panel-active");
    else container.classList.remove("right-panel-active");
}

function showUserInfo(name, avatar, email) {
    document.getElementById('userModalName').innerText = name;
    document.getElementById('userModalEmail').innerText = email;
    document.getElementById('userModalAvatar').src = avatar;
    new bootstrap.Modal(document.getElementById('userProfileModal')).show();
}

function logout() { localStorage.clear(); location.reload(); }
