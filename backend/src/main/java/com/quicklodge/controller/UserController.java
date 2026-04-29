package com.quicklodge.controller;

import com.quicklodge.dto.request.user.UpdateProfileRequest;
import com.quicklodge.dto.response.user.UserResponse;
import com.quicklodge.exception.UnauthorizedException;
import com.quicklodge.repository.UserRepository;
import com.quicklodge.service.UserService;
import com.quicklodge.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return ResponseEntity.ok(userService.getProfile(email));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @PostMapping("/me/become-host")
    public ResponseEntity<UserResponse> becomeHost() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        return ResponseEntity.ok(userService.enableHostRole(email));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount() {
        String email = SecurityUtils.getCurrentUserEmail();
        if (email == null) throw new UnauthorizedException("Non authentifié");
        userService.deleteMyAccount(email);
        return ResponseEntity.noContent().build();
    }
}
