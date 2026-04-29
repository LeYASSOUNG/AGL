package com.quicklodge.config;

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Corps JSON avec photos en base64 : la limite par défaut du connecteur Tomcat (~2 Mo) provoque une coupure / erreur.
 */
@Configuration
public class TomcatConfig {

    private static final int MAX_POST_BYTES = 35 * 1024 * 1024;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatMaxPostSize() {
        return factory -> factory.addConnectorCustomizers(connector -> connector.setMaxPostSize(MAX_POST_BYTES));
    }
}
