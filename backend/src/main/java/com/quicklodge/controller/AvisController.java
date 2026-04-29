package com.quicklodge.controller;

import com.quicklodge.dto.request.avis.CreateAvisRequest;
import com.quicklodge.dto.response.avis.AvisResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.AvisService;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/avis")
@RequiredArgsConstructor
public class AvisController {

    private final AvisService avisService;
    private final UserRepository userRepository;

    @GetMapping("/etablissement/{id}")
    public ResponseEntity<List<AvisResponse>> getByEtablissement(@PathVariable Long id) {
        return ResponseEntity.ok(avisService.findByEtablissement(id));
    }

    @PostMapping
    public ResponseEntity<AvisResponse> create(@Valid @RequestBody CreateAvisRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(avisService.create(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AvisResponse> update(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        Long userId = getCurrentUserId();
        String reponseHote = body != null ? body.get("reponseHote") : null;
        return ResponseEntity.ok(avisService.update(id, userId, reponseHote));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        avisService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mes")
    public ResponseEntity<List<AvisResponse>> mesAvis() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(avisService.findByAuteur(userId));
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable")).getId();
    }
}
