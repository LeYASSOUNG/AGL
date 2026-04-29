package com.quicklodge.controller;

import com.quicklodge.dto.request.type.TypeBadgeRequest;
import com.quicklodge.dto.response.type.TypeBadgeResponse;
import com.quicklodge.service.TypeBadgeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TypeBadgeController {

    private final TypeBadgeService service;

    @GetMapping("/v1/type-badge")
    public ResponseEntity<List<TypeBadgeResponse>> getAllActifs() {
        return ResponseEntity.ok(service.getAllActifs());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/v1/admin/type-badge")
    public ResponseEntity<TypeBadgeResponse> create(@Valid @RequestBody TypeBadgeRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/v1/admin/type-badge/{id}")
    public ResponseEntity<TypeBadgeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TypeBadgeRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/v1/admin/type-badge/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        service.toggleActif(id);
        return ResponseEntity.noContent().build();
    }
}
