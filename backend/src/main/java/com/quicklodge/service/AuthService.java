package com.quicklodge.service;

import com.quicklodge.dto.request.auth.LoginRequest;
import com.quicklodge.dto.request.auth.RefreshTokenRequest;
import com.quicklodge.dto.request.auth.RegisterRequest;
import com.quicklodge.dto.response.auth.AuthResponse;
import com.quicklodge.dto.response.auth.RefreshTokenResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    RefreshTokenResponse refreshToken(RefreshTokenRequest request);
    void logout(String refreshToken);
}
