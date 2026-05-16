// auth.js - Debugging OTP Resend

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
        authSec.innerHTML = `<button class="btn-login-nav" data-bs-toggle="modal" data-bs-target="#authModal">ĐĂNG NHẬP</button>`;
    }
}

// HÀM GỬI OTP (ĐÃ THÊM LOG ĐỂ DEBUG)
async function sendOtp() {
    const email = document.getElementById('regEmail').value;
    const errDiv = document.getElementById('regError');

    if(!email) {
        if (errDiv) { errDiv.innerText = "Vui lòng nhập Email để gửi mã OTP!"; errDiv.style.display = 'block'; }
        return;
    }

    // Xóa lỗi cũ
    if (errDiv) errDiv.style.display = 'none';

    try {
        console.log("Frontend: Đang gửi yêu cầu OTP cho email:", email);
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        if (res.ok) {
            const msg = await res.text();
            alert(msg); // Hiển thị thông báo từ Backend
            console.log("Frontend: Yêu cầu OTP thành công. Thông báo:", msg);
        } else {
            const errorMsg = await res.text();
            if (errDiv) { errDiv.innerText = errorMsg || "Lỗi gửi OTP không xác định!"; errDiv.style.display = 'block'; }
            console.error("Frontend: Yêu cầu OTP thất bại. Lỗi:", errorMsg);
        }
    } catch (err) {
        console.error("Frontend: Lỗi kết nối khi gửi OTP:", err);
        if (errDiv) { errDiv.innerText = "Không thể kết nối đến Server để gửi OTP!"; errDiv.style.display = 'block'; }
    }
}

// CÁC HÀM KHÁC (GIỮ NGUYÊN)
async function handleRegister() {
    const fullName = document.getElementById('regFullName').value;
    const username = document.getElementById('regUser').value;
    const password = document.getElementById('regPass').value;
    const email = document.getElementById('regEmail').value;
    const otp = document.getElementById('regOtp').value;
    const errDiv = document.getElementById('regError');

    if (errDiv) errDiv.style.display = 'none';

    if (!fullName || !username || !password || !email || !otp) {
        if (errDiv) { errDiv.innerText = "Vui lòng điền đầy đủ thông tin và mã OTP!"; errDiv.style.display = 'block'; }
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                fullName: fullName,
                otp: otp
            })
        });

        if (res.ok) {
            alert("Chúc mừng! Đăng ký tài khoản thành công. Vui lòng đăng nhập.");
            toggleAuthPanel('signIn');
        } else {
            const errorMsg = await res.text();
            if (errDiv) { errDiv.innerText = errorMsg || "Lỗi đăng ký không xác định!"; errDiv.style.display = 'block'; }
        }
    } catch (err) {
        console.error("Lỗi kết nối khi đăng ký:", err);
        if (errDiv) { errDiv.innerText = "Không thể kết nối đến Server để đăng ký!"; errDiv.style.display = 'block'; }
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
            localStorage.setItem('userRole', data.role || 'STUDENT');
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

async function handleUpdateAvatar(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const username = localStorage.getItem('user');

        if (!username) {
            alert("Bạn cần đăng nhập để cập nhật avatar!");
            return;
        }

        const maxSize = 2 * 1024 * 1024; 
        if (file.size > maxSize) {
            alert("⚠️ Ảnh đại diện quá lớn! Vui lòng chọn ảnh dưới 2MB.");
            return;
        }

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            alert("⚠️ Định dạng ảnh không hỗ trợ! Chỉ nhận JPG, PNG, GIF.");
            return;
        }

        const formData = new FormData();
        formData.append("avatar", file);

        try {
            const response = await fetch(`/api/auth/profile/${username}/avatar`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const imageUrl = await response.text();
                localStorage.setItem('userAvatar', imageUrl);
                alert("Đã cập nhật ảnh đại diện thành công!");
                location.reload();
            } else {
                const errorMsg = await response.text();
                alert("Lỗi cập nhật avatar: " + errorMsg);
            }
        } catch (err) {
            console.error("Lỗi kết nối khi cập nhật avatar:", err);
            alert("Không thể kết nối đến Server để cập nhật avatar!");
        }
    }
}

function logout() { localStorage.clear(); location.reload(); }