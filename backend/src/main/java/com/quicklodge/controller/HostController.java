package com.quicklodge.controller;

import com.quicklodge.dto.response.reservation.ReservationResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.ReservationService;
import com.quicklodge.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/host")
@RequiredArgsConstructor
public class HostController {

    private final ReservationService reservationService;
    private final UserRepository userRepository;

    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationResponse>> reservations() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(reservationService.findByHote(userId));
    }

    private Long getCurrentUserId() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable")).getId();
    }
}
