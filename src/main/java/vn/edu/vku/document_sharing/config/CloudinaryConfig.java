package vn.edu.vku.document_sharing.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "dvywhicrc",
                "api_key", "457722398163925",
                "api_secret", "Bz8RlQy_OG2agzPQmIzHoigJopc",
                "secure", true
        ));
    }
}
