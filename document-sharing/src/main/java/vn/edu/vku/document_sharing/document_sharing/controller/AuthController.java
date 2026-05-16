package vn.edu.vku.document_sharing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.vku.document_sharing.entity.User;
import vn.edu.vku.document_sharing.repository.UserRepository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime; // Import LocalDateTime
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${upload.path:uploads/avatars}")
    private String uploadPath;

    // Lớp nội bộ để lưu OTP và thời gian hết hạn
    private static class OtpEntry {
        String otp;
        LocalDateTime expirationTime;

        public OtpEntry(String otp, LocalDateTime expirationTime) {
            this.otp = otp;
            this.expirationTime = expirationTime;
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expirationTime);
        }
    }

    // Sử dụng ConcurrentHashMap để lưu OtpEntry
    private Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) return ResponseEntity.badRequest().body("Email không được trống!");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email này đã được đăng ký!");
        }

        String otp = String.valueOf((int)(Math.random() * 899999) + 100000);
        LocalDateTime expirationTime = LocalDateTime.now().plusSeconds(60); // OTP hết hạn sau 60 giây
        otpStore.put(email, new OtpEntry(otp, expirationTime));

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("firedragon2k7@gmail.com");
            message.setTo(email);
            message.setSubject("MÃ XÁC THỰC DX SHARE - TÀI LIỆU VKU");
            message.setText("Chào Phước (hoặc sinh viên VKU),\n\nMã xác thực OTP của bạn là: " + otp + "\n\nMã này sẽ hết hạn sau 60 giây. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nDX SHARE Team.");
            
            mailSender.send(message);
            System.out.println(">>> Đã gửi OTP: " + otp + " tới " + email + ", hết hạn lúc: " + expirationTime);
            return ResponseEntity.ok("Mã xác thực đã được gửi tới Gmail của bạn và sẽ hết hạn sau 60 giây!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi gửi Mail: " + e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> data) {
        String u = data.get("username");
        String e = data.get("email");
        String p = data.get("password");
        String inputOtp = data.get("otp");
        String fullName = data.get("fullName");
        String phone = data.get("phone");

        // 1. KIỂM TRA OTP VÀ THỜI GIAN HẾT HẠN
        OtpEntry otpEntry = otpStore.get(e);
        if (otpEntry == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mã OTP không tồn tại. Vui lòng gửi lại mã!");
        }
        if (otpEntry.isExpired()) {
            otpStore.remove(e); // Xóa OTP đã hết hạn
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới!");
        }
        if (!otpEntry.otp.equals(inputOtp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mã OTP không đúng!");
        }
        otpStore.remove(e); // Xóa OTP sau khi xác thực thành công

        // 2. KIỂM TRA TÊN ĐĂNG NHẬP VÀ EMAIL ĐÃ TỒN TẠI
        if (userRepository.findByUsername(u).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Tên đăng nhập đã tồn tại!");
        }
        if (userRepository.findByEmail(e).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email này đã được đăng ký!");
        }

        // 3. TẠO USER MỚI
        User newUser = new User();
        newUser.setUsername(u);
        newUser.setEmail(e);
        newUser.setPasswordHash(p);
        newUser.setFullName(fullName);
        newUser.setPhone(phone != null ? phone : "0123456789");
        newUser.setRole("STUDENT");
        newUser.setPoints(0);

        try {
            userRepository.save(newUser);
            return ResponseEntity.ok("Đăng ký thành công!");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi Database khi lưu người dùng: " + ex.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        return userRepository.findByUsername(username)
                .map(user -> {
                    if (user.getPasswordHash().equals(password)) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("username", user.getUsername());
                        response.put("fullName", user.getFullName());
                        response.put("email", user.getEmail());
                        response.put("avatarUrl", user.getAvatarUrl());
                        response.put("role", user.getRole());
                        return ResponseEntity.ok(response);
                    }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mật khẩu không đúng!");
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Tài khoản không tồn tại!"));
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    Map<String, Object> profile = new HashMap<>();
                    profile.put("fullName", user.getFullName());
                    profile.put("email", user.getEmail());
                    profile.put("avatarUrl", user.getAvatarUrl());
                    return ResponseEntity.ok(profile);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/profile/{username}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable String username, @RequestParam("avatar") MultipartFile file) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    if (file.isEmpty()) {
                        return ResponseEntity.badRequest().body("File ảnh không được trống!");
                    }
                    try {
                        Path uploadPathDir = Paths.get(uploadPath).toAbsolutePath().normalize();
                        Files.createDirectories(uploadPathDir);

                        String originalFilename = file.getOriginalFilename();
                        String fileExtension = "";
                        if (originalFilename != null && originalFilename.contains(".")) {
                            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                        }
                        String fileName = username + "_" + System.currentTimeMillis() + fileExtension;
                        Path filePath = uploadPathDir.resolve(fileName);

                        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                        String webUrl = "/uploads/avatars/" + fileName;
                        user.setAvatarUrl(webUrl);
                        userRepository.save(user);

                        return ResponseEntity.ok(webUrl);
                    } catch (IOException e) {
                        e.printStackTrace();
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi khi lưu file ảnh: " + e.getMessage());
                    } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi không xác định khi upload avatar: " + e.getMessage());
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy người dùng để cập nhật avatar!"));
    }
}