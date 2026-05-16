package vn.edu.vku.document_sharing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.edu.vku.document_sharing.entity.Document;
import vn.edu.vku.document_sharing.entity.Review;
import vn.edu.vku.document_sharing.entity.User;
import vn.edu.vku.document_sharing.repository.DocumentRepository;
import vn.edu.vku.document_sharing.repository.ReviewRepository;
import vn.edu.vku.document_sharing.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalDocs", documentRepository.count());
        stats.put("totalReviews", reviewRepository.count());
        stats.put("pendingDocs", documentRepository.findAll().stream().filter(d -> d.getStatus() == Document.Status.PENDING).count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa người dùng!");
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getAllDocs() {
        return ResponseEntity.ok(documentRepository.findAll());
    }

    @PutMapping("/documents/{id}/status")
    public ResponseEntity<?> updateDocStatus(@PathVariable Long id, @RequestParam Document.Status status) {
        return documentRepository.findById(id).map(doc -> {
            doc.setStatus(status);
            documentRepository.save(doc);
            return ResponseEntity.ok("Cập nhật thành công!");
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        if(documentRepository.existsById(id)) {
            documentRepository.deleteById(id);
            return ResponseEntity.ok("Đã xóa tài liệu!");
        }
        return ResponseEntity.notFound().build();
    }

    // SỬA LỖI XÓA BÌNH LUẬN TRIỆT ĐỂ
    @Transactional
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        return reviewRepository.findById(id).map(review -> {
            try {
                // 1. Gỡ bỏ liên kết với Document để tránh Hibernate lưu ngược lại
                Document doc = review.getDocument();
                if (doc != null) {
                    doc.getReviews().remove(review);
                    documentRepository.save(doc);
                }
                
                // 2. Thực hiện xóa bình luận
                reviewRepository.delete(review);
                reviewRepository.flush(); // Ép buộc lưu vào DB ngay lập tức
                
                return ResponseEntity.ok("Đã xóa bình luận thành công!");
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Lỗi khi xóa: " + e.getMessage());
            }
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy bình luận ID: " + id));
    }
}
