package com.tradelogger.controller;

import com.tradelogger.entity.Feedback;
import com.tradelogger.entity.FeedbackReply;
import com.tradelogger.service.FeedbackService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.security.core.Authentication;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Controller
public class DashboardController {

    private final FeedbackService feedbackService;

    public DashboardController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping("/")
    public String showDashboard(Model model, Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));

        model.addAttribute("isAdmin", isAdmin);

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

    @GetMapping("/feedback")
    public String showFeedback(Model model) {

        var feedbackList = feedbackService.getAllFeedback();

        model.addAttribute("feedbackList", feedbackList);

        Map<Long, java.util.List<FeedbackReply>> repliesByFeedback =
                new HashMap<>();

        for (Feedback feedback : feedbackList) {
            repliesByFeedback.put(
                    feedback.getId(),
                    feedbackService.getReplies(feedback.getId())
            );
        }

        model.addAttribute("repliesByFeedback", repliesByFeedback);

        return "feedback";
    }

    @PostMapping("/feedback")
    public String submitFeedback(
            @RequestParam Feedback.Category feedbackType,
            @RequestParam(required = false) Integer rating,
            @RequestParam @NotBlank String message,
            Principal principal,
            RedirectAttributes redirectAttributes) {

        feedbackService.saveFeedback(
                principal.getName(),
                feedbackType,
                rating,
                message.trim()
        );

        redirectAttributes.addFlashAttribute(
                "successMessage",
                "Your feedback has been submitted successfully!"
        );

        return "redirect:/feedback";
    }

    @PostMapping("/feedback/{feedbackId}/reply")
    public String submitReply(
            @PathVariable Long feedbackId,
            @RequestParam @NotBlank String message,
            Principal principal,
            RedirectAttributes redirectAttributes) {

        feedbackService.saveReply(
                feedbackId,
                principal.getName(),
                message.trim()
        );

        redirectAttributes.addFlashAttribute(
                "successMessage",
                "Your reply has been posted successfully!"
        );

        return "redirect:/feedback";
    }

    @GetMapping("/settings")
    public String showSettings() {
        return "settings";
    }
}