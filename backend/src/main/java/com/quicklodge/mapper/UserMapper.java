package com.quicklodge.mapper;

import com.quicklodge.dto.response.user.UserResponse;
import com.quicklodge.entity.User;
import com.quicklodge.dto.request.user.UpdateProfileRequest;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .prenom(user.getFirstName())
                .nom(user.getLastName())
                .email(user.getEmail())
                .telephone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream()
                        .map(r -> r.getName().name())
                        .collect(Collectors.toList()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    public void updateEntityFromRequest(User user, UpdateProfileRequest request) {
        if (request.getPrenom() != null) {
            String v = request.getPrenom().trim();
            if (!v.isEmpty()) user.setFirstName(v);
        }
        if (request.getNom() != null) {
            String v = request.getNom().trim();
            if (!v.isEmpty()) user.setLastName(v);
        }
        if (request.getTelephone() != null) {
            String v = request.getTelephone().trim();
            if (!v.isEmpty()) user.setPhone(v);
        }
    }
}
