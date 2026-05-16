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
import java.util.HashMap;
import java.util.Map;

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

    private Map<String, String> otpStore = new HashMap<>();

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) return ResponseEntity.badRequest().body("Email không được trống!");

        String otp = String.valueOf((int)(Math.random() * 899999) + 100000);
        otpStore.put(email, otp);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("firedragon2k7@gmail.com");
            message.setTo(email);
            message.setSubject("MÃ XÁC THỰC DX SHARE - TÀI LIỆU VKU");
            message.setText("Chào Phước (hoặc sinh viên VKU),\n\nMã xác thực OTP của bạn là: " + otp + "\n\nVui lòng không chia sẻ mã này cho bất kỳ ai.\n\nDX SHARE Team.");
            
            mailSender.send(message);
            return ResponseEntity.ok("Mã xác thực đã được gửi tới Gmail của bạn!");
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

        String savedOtp = otpStore.get(e);
        if (savedOtp == null || !savedOtp.equals(inputOtp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Mã OTP không đúng hoặc đã hết hạn!");
        }

        if (userRepository.findByUsername(u).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Tên đăng nhập đã tồn tại!");
        }

        User newUser = new User();
        newUser.setUsername(u);
        newUser.setEmail(e);
        newUser.setPasswordHash(p);
        newUser.setFullName(data.get("fullName"));
        newUser.setPhone(data.get("phone") != null ? data.get("phone") : "0123456789");
        newUser.setRole("STUDENT");
        newUser.setPoints(0);

        userRepository.save(newUser);
        otpStore.remove(e);
        return ResponseEntity.ok("Đăng ký thành công!");
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
                        response.put("fullName", user.getFullName()); // THÊM HỌ TÊN VÀO PHẢN HỒI
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
                    if (file.isEmpty()) return ResponseEntity.badRequest().body("File trống!");
                    try {
                        File uploadDir = new File(uploadPath);
                        if (!uploadDir.exists()) uploadDir.mkdirs();
                        String fileName = username + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        File destFile = new File(uploadDir.getAbsolutePath() + File.separator + fileName);
                        file.transferTo(destFile);
                        String webUrl = "/uploads/avatars/" + fileName;
                        user.setAvatarUrl(webUrl);
                        userRepository.save(user);
                        return ResponseEntity.ok(webUrl);
                    } catch (IOException e) {
                        return ResponseEntity.status(500).body("Lỗi lưu file: " + e.getMessage());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
