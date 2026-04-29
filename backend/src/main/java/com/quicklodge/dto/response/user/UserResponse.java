package com.quicklodge.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private String avatarUrl;
    private List<String> roles;
    private Instant createdAt;
}
