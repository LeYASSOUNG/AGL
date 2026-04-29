package com.quicklodge.controller;

import com.quicklodge.dto.request.auth.LoginRequest;
import com.quicklodge.dto.request.auth.RefreshTokenRequest;
import com.quicklodge.dto.request.auth.RegisterRequest;
import com.quicklodge.dto.response.auth.AuthResponse;
import com.quicklodge.dto.response.auth.RefreshTokenResponse;
import com.quicklodge.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        // Returns {accessToken, refreshToken, user} so the frontend can start an authenticated session immediately.
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        // Returns {accessToken, refreshToken, user}. The refresh token is stored server-side for revocation.
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        // Returns a new access token. Roles are reloaded from DB (source of truth).
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        // Revokes the provided refresh token (if present). Access tokens are stateless and expire naturally.
        if (request != null && request.getRefreshToken() != null) {
            authService.logout(request.getRefreshToken());
        }
        return ResponseEntity.noContent().build();
    }
}
