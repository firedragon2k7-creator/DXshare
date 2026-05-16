package vn.edu.vku.document_sharing.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data // Nếu Phước dùng Lombok, nếu không thì tự Generate Getter/Setter nhé
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String email;

    // Các trường mới Phước vừa yêu cầu:
    @Column(name = "full_name")
    private String fullName;

    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer points = 0;

    private String role; // ADMIN hoặc STUDENT

    // Nếu không dùng @Data, Phước chuột phải chọn Generate -> Getter and Setter cho tất cả nhé!
}