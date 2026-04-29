package com.quicklodge.controller;

import com.quicklodge.dto.request.paiement.CreatePaiementRequest;
import com.quicklodge.dto.response.paiement.PaiementResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.PaiementService;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/paiements")
@RequiredArgsConstructor
public class PaiementController {

    private final PaiementService paiementService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<PaiementResponse> create(@Valid @RequestBody CreatePaiementRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(paiementService.create(userId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaiementResponse> getById(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(paiementService.findById(id, userId));
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<PaiementResponse> validate(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(paiementService.validate(id, userId));
    }

    @PutMapping("/{id}/refund")
    public ResponseEntity<PaiementResponse> refund(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(paiementService.refund(id, userId));
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable")).getId();
    }
}
