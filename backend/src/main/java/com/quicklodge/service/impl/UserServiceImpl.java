package com.quicklodge.service.impl;

import com.quicklodge.dto.request.user.UpdateProfileRequest;
import com.quicklodge.dto.response.user.UserResponse;
import com.quicklodge.entity.ERole;
import com.quicklodge.entity.Role;
import com.quicklodge.entity.User;
import com.quicklodge.exception.ResourceNotFoundException;
import com.quicklodge.mapper.UserMapper;
import com.quicklodge.repository.RoleRepository;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.EtablissementPhotoStorageService;
import com.quicklodge.service.UserService;
import com.quicklodge.util.EtablissementPhotoUrlBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final EtablissementPhotoStorageService photoStorage;
    private final EtablissementPhotoUrlBuilder photoUrlBuilder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        userMapper.updateEntityFromRequest(user, request);

        if (request.getAvatarDataUrl() != null) {
            String trimmed = request.getAvatarDataUrl().trim();
            if (trimmed.isEmpty()) {
                deleteStoredUserAvatarIfOwned(user.getAvatarUrl());
                user.setAvatarUrl(null);
            } else {
                deleteStoredUserAvatarIfOwned(user.getAvatarUrl());
                var decoded = photoStorage.parseDataUrlAvatar(trimmed);
                String path = photoStorage.saveUserAvatarFile(user.getId(), decoded);
                user.setAvatarUrl(photoUrlBuilder.toPublicUrl(path));
            }
        } else if (request.getAvatarUrl() != null) {
            String u = request.getAvatarUrl().trim();
            if (u.isEmpty()) {
                deleteStoredUserAvatarIfOwned(user.getAvatarUrl());
                user.setAvatarUrl(null);
            } else {
                deleteStoredUserAvatarIfOwned(user.getAvatarUrl());
                user.setAvatarUrl(u);
            }
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    private void deleteStoredUserAvatarIfOwned(String avatarPublicUrl) {
        if (avatarPublicUrl == null || avatarPublicUrl.isBlank()) {
            return;
        }
        int idx = avatarPublicUrl.indexOf("/files/");
        if (idx < 0) {
            return;
        }
        String rel = avatarPublicUrl.substring(idx + "/files/".length());
        if (rel.startsWith("user-avatars/")) {
            photoStorage.deleteStoredFile(rel);
        }
    }

    @Override
    @Transactional
    public UserResponse enableHostRole(String email) {
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        if (user.hasRole(ERole.ROLE_HOST)) {
            return userMapper.toResponse(user);
        }
        Role roleHost = roleRepository.findByName(ERole.ROLE_HOST)
                .orElseThrow(() -> new IllegalStateException("Rôle ROLE_HOST introuvable"));
        user.addRole(roleHost);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteMyAccount(String email) {
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Supprime avatar stocké si nécessaire
        deleteStoredUserAvatarIfOwned(user.getAvatarUrl());
        user.setAvatarUrl(null);

        // Désactive + anonymise (on conserve l'entité pour ne pas casser les références : réservations, établissements, etc.)
        user.setEnabled(false);
        user.setFirstName("Utilisateur");
        user.setLastName("Supprimé");
        user.setPhone(null);

        // Email doit rester unique : on le remplace par un alias inoffensif et unique.
        // Format court, stable et sans caractère spécial.
        String tombstone = "deleted+" + user.getId() + "+" + UUID.randomUUID().toString().replace("-", "") + "@quicklodge.local";
        if (tombstone.length() > 255) {
            tombstone = tombstone.substring(0, 255);
        }
        user.setEmail(tombstone);

        // Invalide les sessions (refresh tokens)
        if (user.getRefreshTokens() != null) {
            user.getRefreshTokens().clear();
        }

        // Détache les badges (nettoyage jointure)
        if (user.getBadges() != null) {
            user.getBadges().clear();
        }

        // Rend le compte inutilisable côté auth
        user.setPasswordHash(UUID.randomUUID().toString());

        userRepository.save(user);
    }
}
