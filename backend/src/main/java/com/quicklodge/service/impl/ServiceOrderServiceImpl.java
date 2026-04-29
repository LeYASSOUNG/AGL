package com.quicklodge.service.impl;

import com.quicklodge.dto.request.reservation.ReservationServiceItemRequest;
import com.quicklodge.dto.request.serviceorder.CreateServiceOrderRequest;
import com.quicklodge.dto.response.serviceorder.ServiceOrderLineResponse;
import com.quicklodge.dto.response.serviceorder.ServiceOrderResponse;
import com.quicklodge.entity.*;
import com.quicklodge.exception.BadRequestException;
import com.quicklodge.exception.ForbiddenException;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.repository.ServiceOrderRepository;
import com.quicklodge.repository.ServiceRepository;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.ServiceOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ServiceOrderServiceImpl implements ServiceOrderService {

    private final ServiceOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;

    @Override
    @Transactional
    public ServiceOrderResponse create(Long userId, CreateServiceOrderRequest request) {
        User client = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<ReservationServiceItemRequest> selections = request.getServiceSelections();
        if (selections == null || selections.isEmpty()) {
            throw new BadRequestException("Au moins un service est requis");
        }

        ServiceOrder order = ServiceOrder.builder()
                .client(client)
                .serviceDate(request.getServiceDate())
                .commentaire(request.getCommentaire())
                .statut(StatutServiceOrder.EN_ATTENTE)
                .montantTotal(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (ReservationServiceItemRequest item : selections) {
            if (item == null || item.getServiceId() == null) continue;
            int qty = item.getQuantity() == null ? 1 : item.getQuantity();
            if (qty < 1 || qty > 99) {
                throw new BadRequestException("Quantité invalide (1 à 99)");
            }
            com.quicklodge.entity.Service s = serviceRepository.findById(item.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service", "id", item.getServiceId()));
            if (Boolean.FALSE.equals(s.getActif())) {
                throw new BadRequestException("Service indisponible");
            }
            // Only PAID services can be ordered as standalone extras
            if (s.getPricingType() != null && s.getPricingType() != ServicePricingType.PAID) {
                throw new BadRequestException("Ce service ne peut pas être commandé séparément");
            }

            ServiceOrderLine line = ServiceOrderLine.builder()
                    .order(order)
                    .service(s)
                    .quantity(qty)
                    .build();
            order.getLines().add(line);

            BigDecimal unit = s.getPrix() != null ? s.getPrix() : BigDecimal.ZERO;
            total = total.add(unit.multiply(BigDecimal.valueOf(qty)));
        }
        order.setMontantTotal(total);

        order = orderRepository.save(order);
        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceOrderResponse findById(Long id, Long userId) {
        ServiceOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceOrder", "id", id));
        if (!order.getClient().getId().equals(userId)) {
            throw new ForbiddenException("Accès refusé");
        }
        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceOrderResponse> myOrders(Long userId) {
        return orderRepository.findByClientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ServiceOrderResponse markPaid(Long id, Long userId) {
        ServiceOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceOrder", "id", id));
        if (!order.getClient().getId().equals(userId)) {
            throw new ForbiddenException("Accès refusé");
        }
        if (order.getStatut() == StatutServiceOrder.ANNULEE) {
            throw new BadRequestException("Commande annulée");
        }
        order.setStatut(StatutServiceOrder.PAYEE);
        return toResponse(orderRepository.save(order));
    }

    private ServiceOrderResponse toResponse(ServiceOrder order) {
        List<ServiceOrderLineResponse> lines = new ArrayList<>();
        if (order.getLines() != null) {
            for (ServiceOrderLine l : order.getLines()) {
                com.quicklodge.entity.Service s = l.getService();
                BigDecimal unit = s.getPrix() != null ? s.getPrix() : BigDecimal.ZERO;
                int qty = l.getQuantity() == null ? 1 : l.getQuantity();
                BigDecimal lineTotal = unit.multiply(BigDecimal.valueOf(qty));
                lines.add(ServiceOrderLineResponse.builder()
                        .serviceId(s.getId())
                        .libelle(s.getLibelle())
                        .quantity(qty)
                        .unitPrice(unit)
                        .lineTotal(lineTotal)
                        .build());
            }
        }
        return ServiceOrderResponse.builder()
                .id(order.getId())
                .statut(order.getStatut())
                .serviceDate(order.getServiceDate())
                .montantTotal(order.getMontantTotal())
                .commentaire(order.getCommentaire())
                .lines(lines)
                .createdAt(order.getCreatedAt())
                .build();
    }
}

