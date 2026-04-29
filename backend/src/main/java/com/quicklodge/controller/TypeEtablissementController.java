package com.quicklodge.controller;

import com.quicklodge.dto.request.type.TypeEtablissementRequest;
import com.quicklodge.dto.response.type.TypeEtablissementResponse;
import com.quicklodge.service.TypeEtablissementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TypeEtablissementController {

    private final TypeEtablissementService service;

    /** Public: retourne uniquement les types actifs. */
    @GetMapping("/v1/type-etablissement")
    public ResponseEntity<List<TypeEtablissementResponse>> getAllActifs() {
        return ResponseEntity.ok(service.getAllActifs());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/v1/admin/type-etablissement")
    public ResponseEntity<TypeEtablissementResponse> create(@Valid @RequestBody TypeEtablissementRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/v1/admin/type-etablissement/{id}")
    public ResponseEntity<TypeEtablissementResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TypeEtablissementRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/v1/admin/type-etablissement/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        service.toggleActif(id);
        return ResponseEntity.noContent().build();
    }
}

