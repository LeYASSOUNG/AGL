package com.quicklodge.service.impl;

import com.quicklodge.dto.request.auth.LoginRequest;
import com.quicklodge.dto.request.auth.RefreshTokenRequest;
import com.quicklodge.dto.request.auth.RegisterRequest;
import com.quicklodge.dto.response.auth.AuthResponse;
import com.quicklodge.dto.response.auth.RefreshTokenResponse;
import com.quicklodge.dto.response.user.UserResponse;
import com.quicklodge.entity.ERole;
import com.quicklodge.entity.RefreshToken;
import com.quicklodge.entity.Role;
import com.quicklodge.entity.User;
import com.quicklodge.exception.ConflictException;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.mapper.UserMapper;
import com.quicklodge.repository.RefreshTokenRepository;
import com.quicklodge.repository.RoleRepository;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.AuthService;
import com.quicklodge.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Registration is treated as an immediate "login":
        // - we persist the user
        // - we mint an access token (short-lived) and a refresh token (long-lived, stored server-side)
        // This allows the frontend to start authenticated sessions right away.
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email déjà utilisé");
        }
        Role roleClient = roleRepository.findByName(ERole.ROLE_CLIENT)
                .orElseThrow(() -> new IllegalStateException("Rôle ROLE_CLIENT introuvable"));
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getMotDePasse()))
                .firstName(request.getPrenom())
                .lastName(request.getNom())
                .phone(request.getTelephone())
                .enabled(true)
                .build();
        user.addRole(roleClient);
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtils.generateAccessToken(userDetails);
        String refreshTokenStr = jwtUtils.generateRefreshToken(user.getEmail());
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .expiresAt(Instant.now().plusMillis(jwtUtils.getRefreshExpirationMs()))
                .revoked(false)
                .user(user)
                .build();
        refreshTokenRepository.save(refreshToken);

        UserResponse userResponse = userMapper.toResponse(user);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // AuthenticationManager validates the credentials.
        // We then load the user WITH roles to embed them in the access token claim ("roles").
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse()));
        User user = userRepository.findByEmailWithRoles(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Utilisateur introuvable"));
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtils.generateAccessToken(userDetails);
        String refreshTokenStr = jwtUtils.generateRefreshToken(user.getEmail());
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .expiresAt(Instant.now().plusMillis(jwtUtils.getRefreshExpirationMs()))
                .revoked(false)
                .user(user)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        // Refresh flow:
        // - client sends refresh token
        // - server checks: exists + not revoked + not expired
        // - server returns a NEW access token (roles come from DB, so they can change over time)
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token invalide"));
        if (Boolean.TRUE.equals(refreshToken.getRevoked()) || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expiré ou révoqué");
        }
        User user = refreshToken.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtils.generateAccessToken(userDetails);
        return RefreshTokenResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        // Logout is implemented by revoking the refresh token in DB.
        // Existing access tokens remain valid until expiration (stateless JWT).
        refreshTokenRepository.findByToken(refreshToken).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }
}
