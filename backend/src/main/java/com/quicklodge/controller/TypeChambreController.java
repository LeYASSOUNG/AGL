package com.quicklodge.controller;

import com.quicklodge.dto.request.type.TypeChambreRequest;
import com.quicklodge.dto.response.type.TypeChambreResponse;
import com.quicklodge.service.TypeChambreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TypeChambreController {

    private final TypeChambreService service;

    /** Public: retourne uniquement les types actifs. */
    @GetMapping("/v1/type-chambre")
    public ResponseEntity<List<TypeChambreResponse>> getAllActifs() {
        return ResponseEntity.ok(service.getAllActifs());
    }

    /** Alias public (style API Booking / REST lisible). */
    @GetMapping("/type-chambres")
    public ResponseEntity<List<TypeChambreResponse>> getTypeChambres() {
        return ResponseEntity.ok(service.getAllActifs());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/v1/admin/type-chambre")
    public ResponseEntity<TypeChambreResponse> create(@Valid @RequestBody TypeChambreRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/v1/admin/type-chambre/{id}")
    public ResponseEntity<TypeChambreResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TypeChambreRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/v1/admin/type-chambre/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        service.toggleActif(id);
        return ResponseEntity.noContent().build();
    }
}

