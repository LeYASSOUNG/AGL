package com.quicklodge.controller;

import com.quicklodge.dto.request.reservation.CancelReservationRequest;
import com.quicklodge.dto.request.reservation.CreateReservationRequest;
import com.quicklodge.dto.request.reservation.UpdateReservationRequest;
import com.quicklodge.dto.response.reservation.ReservationDetailResponse;
import com.quicklodge.dto.response.reservation.ReservationResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.ReservationService;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody CreateReservationRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(reservationService.create(userId, request));
    }

    @GetMapping("/mes")
    public ResponseEntity<List<ReservationResponse>> mesReservations() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(reservationService.findByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationDetailResponse> getById(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(reservationService.findById(id, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReservationResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateReservationRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(reservationService.update(id, userId, request));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ReservationResponse> confirm(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(reservationService.confirm(id, userId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ReservationResponse> cancel(
            @PathVariable Long id,
            @RequestBody(required = false) @Valid CancelReservationRequest request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(reservationService.cancel(id, userId, request));
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable")).getId();
    }
}
