package com.quicklodge.controller;

import com.quicklodge.dto.request.chambre.CreateChambreRequest;
import com.quicklodge.dto.request.chambre.UpdateChambreRequest;
import com.quicklodge.dto.response.chambre.ChambreResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.ChambreService;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class ChambreController {

    private final ChambreService chambreService;
    private final UserRepository userRepository;

    @GetMapping("/etablissements/{id}/chambres")
    public ResponseEntity<List<ChambreResponse>> getByEtablissement(@PathVariable Long id) {
        return ResponseEntity.ok(chambreService.findByEtablissement(id));
    }

    @PostMapping("/host/chambres")
    public ResponseEntity<ChambreResponse> create(@Valid @RequestBody CreateChambreRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(chambreService.create(userId, request));
    }

    /** Création hôte (alias de {@code POST /host/chambres}). */
    @PostMapping("/chambres")
    public ResponseEntity<ChambreResponse> createChambre(@Valid @RequestBody CreateChambreRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(chambreService.create(userId, request));
    }

    @PutMapping("/host/chambres/{id}")
    public ResponseEntity<ChambreResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateChambreRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(chambreService.update(id, userId, request));
    }

    @DeleteMapping("/host/chambres/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        chambreService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable")).getId();
    }
}
