package vn.edu.vku.document_sharing.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.vku.document_sharing.entity.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    // Kiểm tra tồn tại để lúc đăng ký không bị trùng
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}