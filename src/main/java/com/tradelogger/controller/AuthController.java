
package com.tradelogger.controller;

import com.tradelogger.dto.ChangePasswordRequest;
import com.tradelogger.dto.RegistrationRequest;
import com.tradelogger.entity.User;
import com.tradelogger.repository.UserRepository;
import com.tradelogger.service.PasswordService;
import com.tradelogger.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

@Controller
public class AuthController {

    private final RegistrationService registrationService;
    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public AuthController(
            RegistrationService registrationService,
            UserRepository userRepository,
            PasswordService passwordService) {
        this.registrationService = registrationService;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "login";
    }

    @GetMapping("/register")
    public String showRegistrationPage() {
        return "register";
    }

    @GetMapping("/api/auth/me")
    @ResponseBody
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {

        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "createdAt", user.getCreatedAt()
        ));
    }

    @PostMapping("/api/auth/change-password")
    @ResponseBody
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        try {
            passwordService.changePassword(authentication.getName(), request);

            return ResponseEntity.ok(Map.of(
                    "message", "Password changed successfully."
            ));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", exception.getMessage()
            ));
        }
    }

    @PostMapping("/api/auth/register")
    public String registerUser(
            @Valid @ModelAttribute RegistrationRequest request,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    "Please provide valid registration details."
            );
            return "redirect:/register";
        }

        try {
            registrationService.registerUser(request);

            redirectAttributes.addFlashAttribute(
                    "success",
                    "Account created successfully. Please log in."
            );

            return "redirect:/login";

        } catch (IllegalArgumentException exception) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    exception.getMessage()
            );

            return "redirect:/register";
        }
    }
}
