package com.quicklodge.controller;

import com.quicklodge.dto.request.type.TypeNotificationRequest;
import com.quicklodge.dto.response.type.TypeNotificationResponse;
import com.quicklodge.service.TypeNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TypeNotificationController {

    private final TypeNotificationService service;

    @GetMapping("/v1/type-notification")
    public ResponseEntity<List<TypeNotificationResponse>> getAllActifs() {
        return ResponseEntity.ok(service.getAllActifs());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/v1/admin/type-notification")
    public ResponseEntity<TypeNotificationResponse> create(@Valid @RequestBody TypeNotificationRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/v1/admin/type-notification/{id}")
    public ResponseEntity<TypeNotificationResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TypeNotificationRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/v1/admin/type-notification/{id}/toggle")
    public ResponseEntity<Void> toggle(@PathVariable Long id) {
        service.toggleActif(id);
        return ResponseEntity.noContent().build();
    }
}
