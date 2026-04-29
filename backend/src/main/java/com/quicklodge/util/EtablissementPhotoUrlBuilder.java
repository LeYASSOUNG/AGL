package com.quicklodge.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EtablissementPhotoUrlBuilder {

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    public String toPublicUrl(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return null;
        }
        String cp = contextPath == null ? "" : contextPath;
        return cp + "/files/" + storagePath;
    }
}
