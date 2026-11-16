
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

    @GetMapping("/analytics/setup-performance")
    public String showSetupPerformance() {
        return "setup-performance";
    }

    @GetMapping("/analytics/instrument-analysis")
    public String showInstrumentAnalysis() {
        return "instrument-analysis";
    }

    @GetMapping("/calendar")
    public String showTradingCalendar() {
        return "trading-calendar";
    }

    @GetMapping("/prop-firm-tracker")
    public String showPropFirmTracker() {
        return "prop-firm-tracker";
    }

    @GetMapping("/settings")
    public String showSettings() {
        return "settings";
    }
}
