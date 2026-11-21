package com.tradelogger.controller;

import com.tradelogger.entity.User;
import com.tradelogger.repository.UserRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public String showAdminDashboard(Model model) {

        List<User> users = userRepository.findAll();

        long totalUsers = users.size();

        long totalAdmins = users.stream()
                .filter(user -> "ADMIN".equalsIgnoreCase(user.getRole()))
                .count();

        long totalRegularUsers = totalUsers - totalAdmins;

        model.addAttribute("users", users);
        model.addAttribute("totalUsers", totalUsers);
        model.addAttribute("totalAdmins", totalAdmins);
        model.addAttribute("totalRegularUsers", totalRegularUsers);

        return "admin";
    }
}