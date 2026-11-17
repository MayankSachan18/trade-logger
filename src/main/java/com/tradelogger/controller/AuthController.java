
package com.tradelogger.controller;

import com.tradelogger.dto.RegistrationRequest;
import com.tradelogger.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AuthController {

    private final RegistrationService registrationService;

    public AuthController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "login";
    }

    @GetMapping("/register")
    public String showRegistrationPage() {
        return "register";
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
