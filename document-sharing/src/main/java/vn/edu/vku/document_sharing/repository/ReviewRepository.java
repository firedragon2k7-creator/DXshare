package vn.edu.vku.document_sharing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.vku.document_sharing.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
}
