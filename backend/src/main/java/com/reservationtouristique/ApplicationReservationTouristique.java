package com.reservationtouristique;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Classe principale de l'application
 * Point d'entrée du backend Spring Boot
 * 
 * @author Équipe de développement
 * @version 1.0.0
 */
@SpringBootApplication
@EnableJpaAuditing
public class ApplicationReservationTouristique {

    public static void main(String[] args) {
        SpringApplication.run(ApplicationReservationTouristique.java, args);
        
        // Message de démarrage
        System.out.println("\n" +
            "================================================\n" +
            "  🏨 Plateforme Réservation Touristique\n" +
            "  📡 Serveur : http://localhost:8080\n" +
            "  📚 Documentation : http://localhost:8080/swagger-ui.html\n" +
            "================================================\n"
        );
    }
}