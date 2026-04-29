package com.quicklodge.controller;

import com.quicklodge.dto.request.serviceorder.CreateServiceOrderRequest;
import com.quicklodge.dto.response.serviceorder.ServiceOrderResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.ServiceOrderService;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/service-orders")
@RequiredArgsConstructor
public class ServiceOrderController {

    private final ServiceOrderService serviceOrderService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ServiceOrderResponse> create(@Valid @RequestBody CreateServiceOrderRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(serviceOrderService.create(userId, request));
    }

    @GetMapping("/mes")
    public ResponseEntity<List<ServiceOrderResponse>> myOrders() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(serviceOrderService.myOrders(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceOrderResponse> getById(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(serviceOrderService.findById(id, userId));
    }

    @PutMapping("/{id}/paid")
    public ResponseEntity<ServiceOrderResponse> markPaid(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(serviceOrderService.markPaid(id, userId));
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable"))
                .getId();
    }
}

