package com.quicklodge.config;

import com.quicklodge.service.EtablissementPhotoStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * Sert les fichiers uploadés sous {@code /files/**} (URL complète avec context-path : {@code /api/files/...}).
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final EtablissementPhotoStorageService photoStorageService;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path root = photoStorageService.uploadRoot();
        String location = root.toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler("/files/**")
                .addResourceLocations(location);
    }
}
