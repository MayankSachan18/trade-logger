
package com.tradelogger.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {

    @GetMapping("/")
    public String showDashboard() {
        return "dashboard";
    }

    @GetMapping("/trades")
    public String showAllTrades() {
        return "trades";
    }
}
