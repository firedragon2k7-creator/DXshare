package vn.edu.vku.document_sharing.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.vku.document_sharing.entity.Document;
import vn.edu.vku.document_sharing.entity.Review;
import vn.edu.vku.document_sharing.entity.User;
import vn.edu.vku.document_sharing.repository.DocumentRepository;
import vn.edu.vku.document_sharing.repository.ReviewRepository;
import vn.edu.vku.document_sharing.repository.UserRepository;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    // 1. Lấy tất cả tài liệu
    @GetMapping
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    // 2. Lấy chi tiết tài liệu (bao gồm cả reviews)
    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocumentById(@PathVariable Long id) {
        return documentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Gửi đánh giá (Review)
    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> addReview(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        return documentRepository.findById(id).map(doc -> {
            try {
                // Xử lý lấy rating an toàn
                Object ratingObj = data.get("rating");
                int rating = (ratingObj instanceof Number) ? ((Number) ratingObj).intValue() : 5;
                
                String comment = (String) data.get("comment");
                String username = (String) data.get("username");

                // Tìm User đang đăng nhập
                User user = userRepository.findByUsername(username)
                        .orElseGet(() -> userRepository.findById(1L).orElse(null));

                if (user == null) return ResponseEntity.badRequest().body("Lỗi: Không xác định được người dùng.");

                Review review = new Review();
                review.setDocument(doc);
                review.setUser(user);
                review.setRating(rating);
                review.setComment(comment);

                reviewRepository.save(review);
                return ResponseEntity.ok("Đã gửi đánh giá thành công!");
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Lỗi Backend: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // 4. Lưu tài liệu từ Cloudinary
    @PostMapping("/upload-link")
    public ResponseEntity<?> saveCloudLink(@RequestBody Map<String, String> data) {
        try {
            String uploaderName = data.get("uploaderName");
            User uploader = userRepository.findByUsername(uploaderName)
                    .orElseGet(() -> userRepository.findById(1L).orElse(null));

            Document doc = new Document();
            doc.setTitle(data.get("title"));
            doc.setDescription(data.get("description"));
            doc.setFileUrl(data.get("fileUrl"));
            doc.setStatus(Document.Status.APPROVED);
            doc.setUploader(uploader);

            documentRepository.save(doc);
            return ResponseEntity.ok("Tải lên thành công!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi DB: " + e.getMessage());
        }
    }

    // 5. Xóa tài liệu
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        return documentRepository.findById(id).map(doc -> {
            documentRepository.delete(doc);
            return ResponseEntity.ok().body("Đã xóa tài liệu!");
        }).orElse(ResponseEntity.notFound().build());
    }
}
