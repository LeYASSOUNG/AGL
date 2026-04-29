package com.quicklodge.service;

import com.quicklodge.dto.request.user.UpdateProfileRequest;
import com.quicklodge.dto.response.user.UserResponse;

public interface UserService {

    UserResponse getProfile(String email);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
    UserResponse enableHostRole(String email);

    /** Désactive et anonymise le compte (suppression logique). */
    void deleteMyAccount(String email);
}
