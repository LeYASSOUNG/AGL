package com.quicklodge.service;

import com.quicklodge.dto.request.serviceorder.CreateServiceOrderRequest;
import com.quicklodge.dto.response.serviceorder.ServiceOrderResponse;

import java.util.List;

public interface ServiceOrderService {
    ServiceOrderResponse create(Long userId, CreateServiceOrderRequest request);
    ServiceOrderResponse findById(Long id, Long userId);
    List<ServiceOrderResponse> myOrders(Long userId);
    ServiceOrderResponse markPaid(Long id, Long userId);
}

