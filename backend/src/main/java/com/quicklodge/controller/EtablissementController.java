package com.quicklodge.controller;

import com.quicklodge.dto.request.etablissement.CreateEtablissementRequest;
import com.quicklodge.dto.request.etablissement.UpdateEtablissementRequest;
import com.quicklodge.dto.response.common.PageResponse;
import com.quicklodge.dto.response.etablissement.EtablissementDetailResponse;
import com.quicklodge.dto.response.etablissement.EtablissementResponse;
import com.quicklodge.dto.response.etablissement.FavoriToggleResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.EtablissementFavoriService;
import com.quicklodge.service.EtablissementService;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class EtablissementController {

    private final EtablissementService etablissementService;
    private final EtablissementFavoriService favoriService;
    private final UserRepository userRepository;

    @GetMapping("/etablissements")
    public ResponseEntity<PageResponse<EtablissementResponse>> search(
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) Long typeEtablissementId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) LocalDate dateDebut,
            @RequestParam(required = false) LocalDate dateFin,
            @RequestParam(required = false) Integer nombreVoyageurs,
            Pageable pageable) {
        return ResponseEntity.ok(etablissementService.search(
                ville, typeEtablissementId, keyword, dateDebut, dateFin, nombreVoyageurs, pageable));
    }

    @GetMapping("/etablissements/{id}")
    public ResponseEntity<EtablissementDetailResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(etablissementService.findById(id));
    }

    /** Destinations : villes distinctes des établissements publics (actifs + validés). */
    @GetMapping("/etablissements/villes")
    public ResponseEntity<List<String>> listPublicVilles() {
        return ResponseEntity.ok(etablissementService.listPublicVilles());
    }

    /** Ajoute/supprime un établissement des favoris (cœurs) de l’utilisateur connecté. */
    @PostMapping("/etablissements/{id}/favoris/toggle")
    public ResponseEntity<FavoriToggleResponse> toggleFavori(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(favoriService.toggleFavori(userId, id));
    }

    /** Liste des IDs d’établissements favoris de l’utilisateur connecté. */
    @GetMapping("/users/me/favoris")
    public ResponseEntity<List<Long>> listMyFavoris() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(favoriService.listFavorisByUser(userId));
    }

    @PostMapping("/host/etablissements")
    public ResponseEntity<EtablissementResponse> create(@Valid @RequestBody CreateEtablissementRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(etablissementService.create(userId, request));
    }

    @PutMapping("/host/etablissements/{id}")
    public ResponseEntity<EtablissementResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEtablissementRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(etablissementService.update(id, userId, request));
    }

    @DeleteMapping("/host/etablissements/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        etablissementService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/host/etablissements/mes")
    public ResponseEntity<List<EtablissementResponse>> mesEtablissements() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(etablissementService.findByHote(userId));
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable")).getId();
    }
}
