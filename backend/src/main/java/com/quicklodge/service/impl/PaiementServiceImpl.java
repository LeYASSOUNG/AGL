package com.quicklodge.service.impl;

import com.quicklodge.dto.request.paiement.CreatePaiementRequest;
import com.quicklodge.dto.response.paiement.PaiementResponse;
import com.quicklodge.entity.Paiement;
import com.quicklodge.entity.Reservation;
import com.quicklodge.entity.ServiceOrder;
import com.quicklodge.entity.StatutPaiement;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.exception.BadRequestException;
import com.quicklodge.mapper.PaiementMapper;
import com.quicklodge.repository.PaiementRepository;
import com.quicklodge.repository.ReservationRepository;
import com.quicklodge.repository.ServiceOrderRepository;
import com.quicklodge.service.PaiementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PaiementServiceImpl implements PaiementService {

    private final PaiementRepository paiementRepository;
    private final ReservationRepository reservationRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final PaiementMapper mapper;

    @Override
    @Transactional
    public PaiementResponse create(Long userId, CreatePaiementRequest request) {
        Reservation reservation = null;
        ServiceOrder serviceOrder = null;
        if (request.getReservationId() != null) {
            reservation = reservationRepository.findById(request.getReservationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", request.getReservationId()));
            if (!reservation.getClient().getId().equals(userId)) {
                throw new ForbiddenException("Vous n'êtes pas le client de cette réservation");
            }
        }
        if (request.getServiceOrderId() != null) {
            serviceOrder = serviceOrderRepository.findById(request.getServiceOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("ServiceOrder", "id", request.getServiceOrderId()));
            if (!serviceOrder.getClient().getId().equals(userId)) {
                throw new ForbiddenException("Vous n'êtes pas le client de cette commande");
            }
        }
        if (reservation == null && serviceOrder == null) {
            throw new BadRequestException("reservationId ou serviceOrderId requis");
        }
        Paiement p = Paiement.builder()
                .reservation(reservation)
                .serviceOrder(serviceOrder)
                .montant(request.getMontant())
                .statut(StatutPaiement.EN_ATTENTE)
                .modePaiement(request.getModePaiement())
                .referenceExterne(request.getReferenceExterne())
                .build();
        p = paiementRepository.save(p);
        return mapper.toResponse(p);
    }

    @Override
    @Transactional
    public PaiementResponse validate(Long paiementId, Long userId) {
        Paiement p = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement", "id", paiementId));
        if (p.getReservation() != null) {
            Long clientId = p.getReservation().getClient().getId();
            Long hoteId = p.getReservation().getEtablissement().getProprietaire().getId();
            if (!clientId.equals(userId) && !hoteId.equals(userId)) {
                throw new ForbiddenException("Accès refusé à ce paiement");
            }
        } else if (p.getServiceOrder() != null) {
            Long clientId = p.getServiceOrder().getClient().getId();
            if (!clientId.equals(userId)) {
                throw new ForbiddenException("Accès refusé à ce paiement");
            }
            p.getServiceOrder().setStatut(com.quicklodge.entity.StatutServiceOrder.PAYEE);
            serviceOrderRepository.save(p.getServiceOrder());
        } else {
            throw new BadRequestException("Paiement orphelin");
        }
        p.setStatut(StatutPaiement.EFFECTUE);
        p.setDateEffectif(Instant.now());
        return mapper.toResponse(paiementRepository.save(p));
    }

    @Override
    @Transactional
    public PaiementResponse refund(Long paiementId, Long userId) {
        Paiement p = paiementRepository.findById(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement", "id", paiementId));
        if (p.getReservation() == null) {
            throw new ForbiddenException("Remboursement non disponible pour ce type de paiement");
        }
        Long hoteId = p.getReservation().getEtablissement().getProprietaire().getId();
        if (!hoteId.equals(userId)) {
            throw new ForbiddenException("Seul l'hôte peut initier un remboursement");
        }
        p.setStatut(StatutPaiement.REMBOURSE);
        return mapper.toResponse(paiementRepository.save(p));
    }

    @Override
    @Transactional(readOnly = true)
    public PaiementResponse findById(Long id, Long userId) {
        Paiement p = paiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement", "id", id));
        if (p.getReservation() != null) {
            Long clientId = p.getReservation().getClient().getId();
            Long hoteId = p.getReservation().getEtablissement().getProprietaire().getId();
            if (!clientId.equals(userId) && !hoteId.equals(userId)) {
                throw new ForbiddenException("Accès refusé à ce paiement");
            }
        } else if (p.getServiceOrder() != null) {
            Long clientId = p.getServiceOrder().getClient().getId();
            if (!clientId.equals(userId)) {
                throw new ForbiddenException("Accès refusé à ce paiement");
            }
        } else {
            throw new ForbiddenException("Accès refusé à ce paiement");
        }
        return mapper.toResponse(p);
    }
}
