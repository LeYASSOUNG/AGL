package com.quicklodge.security;

import com.quicklodge.exception.TokenExpiredException;
import com.quicklodge.util.AppConstants;
import com.quicklodge.util.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filtre JWT : extrait le Bearer token, valide via JwtUtils, reconstruit les autorités
 * depuis le claim "roles" et injecte l'authentification dans le SecurityContext.
 *
 * Important:
 * - This filter is intentionally tolerant: an expired token is treated as "anonymous"
 *   so public endpoints (permitAll) keep working even if the client still sends Authorization.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (StringUtils.hasText(jwt)) {
                if (jwtUtils.validateToken(jwt)) {
                    String email = jwtUtils.getEmailFromToken(jwt);
                    List<String> roles = jwtUtils.getRolesFromToken(jwt);
                    var authorities = roles.stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    var authentication = new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            authorities
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (TokenExpiredException e) {
            // Ne pas court-circuiter la chaîne : traiter comme non authentifié (comme un token absent/invalide).
            // Sinon une route pourtant en permitAll (ex. GET /v1/type-etablissement) renvoie 401 dès qu'un
            // Bearer expiré est présent, ce qui casse le front qui envoie toujours l'en-tête Authorization.
            log.debug("Token expiré, poursuite en anonyme: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        // The API uses the standard Authorization header: "Bearer <token>".
        String headerAuth = request.getHeader(AppConstants.HEADER_AUTHORIZATION);
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith(AppConstants.TOKEN_PREFIX)) {
            return headerAuth.substring(AppConstants.TOKEN_PREFIX.length());
        }
        return null;
    }
}
