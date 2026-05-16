package vn.edu.vku.document_sharing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.vku.document_sharing.entity.Document; // Nhớ sửa đúng tên class Entity của bạn

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    // Tìm kiếm tài liệu theo tiêu đề
    List<Document> findByTitleContainingIgnoreCase(String title);
}