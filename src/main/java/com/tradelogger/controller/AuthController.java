
package com.tradelogger.controller;

import com.tradelogger.dto.ChangePasswordRequest;
import com.tradelogger.dto.RegistrationRequest;
import com.tradelogger.entity.User;
import com.tradelogger.repository.UserRepository;
import com.tradelogger.service.EmailVerificationService;
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
import com.tradelogger.dto.PendingRegistration;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

@Controller
public class AuthController {

    private final RegistrationService registrationService;
    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            RegistrationService registrationService,
            UserRepository userRepository,
            PasswordService passwordService,
            EmailVerificationService emailVerificationService,
            PasswordEncoder passwordEncoder) {

        this.registrationService = registrationService;
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.emailVerificationService = emailVerificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "login";
    }

    @GetMapping("/register")
    public String showRegistrationPage() {
        return "register";
    }

    @GetMapping("/verify-email")
    public String showEmailVerificationPage(HttpSession session) {

        if (session.getAttribute("PENDING_REGISTRATION") == null) {
            return "redirect:/register";
        }

        return "verify-email";
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
            RedirectAttributes redirectAttributes,
            HttpSession session) {

        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    "Please provide valid registration details."
            );
            return "redirect:/register";
        }

        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    "Username is already taken"
            );
            return "redirect:/register";
        }

        if (userRepository.existsByEmail(email)) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    "Email is already registered"
            );
            return "redirect:/register";
        }

        PendingRegistration pendingRegistration =
                new PendingRegistration(
                        username,
                        email,
                        passwordEncoder.encode(request.getPassword())
                );

        session.setAttribute("PENDING_REGISTRATION", pendingRegistration);

        emailVerificationService.sendOtp(email);

        return "redirect:/verify-email";
    }

    @PostMapping("/api/auth/verify-email")
    public String verifyEmail(
            @org.springframework.web.bind.annotation.RequestParam String otp,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        PendingRegistration pendingRegistration =
                (PendingRegistration) session.getAttribute("PENDING_REGISTRATION");

        if (pendingRegistration == null) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    "Registration session expired. Please register again."
            );
            return "redirect:/register";
        }

        boolean verified = emailVerificationService.verifyOtp(
                pendingRegistration.getEmail(),
                otp
        );

        if (!verified) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    "Invalid or expired OTP. Please try again."
            );
            return "redirect:/verify-email";
        }

        try {
            registrationService.registerVerifiedUser(
                    pendingRegistration.getUsername(),
                    pendingRegistration.getEmail(),
                    pendingRegistration.getPasswordHash()
            );

            session.removeAttribute("PENDING_REGISTRATION");

            redirectAttributes.addFlashAttribute(
                    "success",
                    "Email verified and account created successfully. Please log in."
            );

            return "redirect:/login";

        } catch (IllegalArgumentException exception) {
            session.removeAttribute("PENDING_REGISTRATION");

            redirectAttributes.addFlashAttribute(
                    "error",
                    exception.getMessage()
            );

            return "redirect:/register";
        }
    }


    @PostMapping("/api/auth/resend-otp")
    public String resendOtp(
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        PendingRegistration pendingRegistration =
                (PendingRegistration) session.getAttribute("PENDING_REGISTRATION");

        if (pendingRegistration == null) {
            return "redirect:/register";
        }

        try {
            emailVerificationService.sendOtp(pendingRegistration.getEmail());

            redirectAttributes.addFlashAttribute(
                    "success",
                    "A new verification code has been sent to your email."
            );

        } catch (IllegalStateException exception) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    exception.getMessage()
            );
        }

        return "redirect:/verify-email";
    }
}
