package com.quicklodge.controller;

import com.quicklodge.dto.response.avis.AvisAdminResponse;
import com.quicklodge.dto.response.common.MessageResponse;
import com.quicklodge.dto.response.etablissement.EtablissementResponse;
import com.quicklodge.dto.response.reservation.ReservationResponse;
import com.quicklodge.dto.response.user.UserResponse;
import com.quicklodge.entity.User;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.mapper.AvisMapper;
import com.quicklodge.mapper.EtablissementMapper;
import com.quicklodge.mapper.ReservationMapper;
import com.quicklodge.mapper.UserMapper;
import com.quicklodge.repository.AvisRepository;
import com.quicklodge.repository.EtablissementRepository;
import com.quicklodge.repository.ReservationRepository;
import com.quicklodge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final EtablissementRepository etablissementRepository;
    private final ReservationRepository reservationRepository;
    private final AvisRepository avisRepository;
    private final UserMapper userMapper;
    private final EtablissementMapper etablissementMapper;
    private final ReservationMapper reservationMapper;
    private final AvisMapper avisMapper;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        getCurrentUserId(); // ensure admin
        return ResponseEntity.ok(userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList()));
    }

    @PutMapping("/users/{id}/enable")
    public ResponseEntity<MessageResponse> enableUser(@PathVariable Long id) {
        getCurrentUserId();
        User user = userRepository.findById(id).orElseThrow();
        user.setEnabled(true);
        userRepository.save(user);
        return ResponseEntity.ok(MessageResponse.builder().message("Utilisateur activé").success(true).build());
    }

    @PutMapping("/users/{id}/disable")
    public ResponseEntity<MessageResponse> disableUser(@PathVariable Long id) {
        getCurrentUserId();
        User user = userRepository.findById(id).orElseThrow();
        user.setEnabled(false);
        userRepository.save(user);
        return ResponseEntity.ok(MessageResponse.builder().message("Utilisateur désactivé").success(true).build());
    }

    @GetMapping("/etablissements")
    public ResponseEntity<List<EtablissementResponse>> listEtablissements() {
        getCurrentUserId();
        return ResponseEntity.ok(etablissementRepository.findAllWithAdminAssociations().stream()
                .map(etablissementMapper::toResponse)
                .collect(Collectors.toList()));
    }

    /** Hébergements actifs en attente de validation modération. */
    @GetMapping("/etablissements/en-attente")
    public ResponseEntity<List<EtablissementResponse>> listEtablissementsEnAttente() {
        getCurrentUserId();
        return ResponseEntity.ok(etablissementRepository.findByValideAdminIsFalseAndActifIsTrueOrderByCreatedAtDesc()
                .stream()
                .map(etablissementMapper::toResponse)
                .collect(Collectors.toList()));
    }

    @PutMapping("/etablissements/{id}/valider")
    public ResponseEntity<MessageResponse> validerEtablissement(@PathVariable Long id) {
        getCurrentUserId();
        var e = etablissementRepository.findById(id).orElseThrow();
        e.setValideAdmin(true);
        e.setActif(true);
        etablissementRepository.save(e);
        return ResponseEntity.ok(MessageResponse.builder().message("Hébergement validé").success(true).build());
    }

    /**
     * Refus modération : l’établissement n’apparaît plus publiquement (même effet qu’une suspension).
     */
    @PutMapping("/etablissements/{id}/refuser")
    public ResponseEntity<MessageResponse> refuserEtablissement(@PathVariable Long id) {
        getCurrentUserId();
        var e = etablissementRepository.findById(id).orElseThrow();
        e.setValideAdmin(false);
        e.setActif(false);
        etablissementRepository.save(e);
        return ResponseEntity.ok(MessageResponse.builder().message("Hébergement refusé").success(true).build());
    }

    @PutMapping("/etablissements/{id}/suspend")
    public ResponseEntity<MessageResponse> suspendEtablissement(@PathVariable Long id) {
        getCurrentUserId();
        var e = etablissementRepository.findById(id).orElseThrow();
        e.setActif(false);
        etablissementRepository.save(e);
        return ResponseEntity.ok(MessageResponse.builder().message("Établissement suspendu").success(true).build());
    }

    @GetMapping("/avis")
    public ResponseEntity<List<AvisAdminResponse>> listAvis() {
        getCurrentUserId();
        return ResponseEntity.ok(avisRepository.findAllForAdminOrderByCreatedAtDesc().stream()
                .map(avisMapper::toAdminResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationResponse>> listReservations() {
        getCurrentUserId();
        return ResponseEntity.ok(reservationRepository.findAll().stream()
                .map(reservationMapper::toResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        getCurrentUserId();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalEtablissements", etablissementRepository.count());
        stats.put("totalReservations", reservationRepository.count());
        stats.put("totalAvis", avisRepository.count());
        stats.put("etablissementsEnAttenteValidation", etablissementRepository.countByValideAdminIsFalseAndActifIsTrue());
        stats.put("etablissementsPublies", etablissementRepository.countByActifTrueAndValideAdminTrue());
        return ResponseEntity.ok(stats);
    }

    private Long getCurrentUserId() {
        String email = com.quicklodge.util.SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return userRepository.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable")).getId();
    }
}
