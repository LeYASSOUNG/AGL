package com.quicklodge.service;

import com.quicklodge.dto.request.reservation.CancelReservationRequest;
import com.quicklodge.dto.request.reservation.CreateReservationRequest;
import com.quicklodge.dto.request.reservation.UpdateReservationRequest;
import com.quicklodge.dto.response.reservation.ReservationDetailResponse;
import com.quicklodge.dto.response.reservation.ReservationResponse;

import java.util.List;

public interface ReservationService {

    ReservationResponse create(Long userId, CreateReservationRequest request);

    ReservationResponse update(Long reservationId, Long userId, UpdateReservationRequest request);

    ReservationResponse confirm(Long reservationId, Long userId);
    ReservationResponse cancel(Long reservationId, Long userId, CancelReservationRequest request);
    List<ReservationResponse> findByUser(Long userId);
    ReservationDetailResponse findById(Long id, Long userId);
    List<ReservationResponse> findByHote(Long userId);
}
