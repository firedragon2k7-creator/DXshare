package vn.edu.vku.document_sharing.controller;


import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.vku.document_sharing.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    }

