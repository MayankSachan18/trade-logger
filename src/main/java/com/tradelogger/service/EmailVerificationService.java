
package com.tradelogger.service;

import com.tradelogger.entity.EmailVerification;
import com.tradelogger.repository.EmailVerificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class EmailVerificationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(
            EmailVerificationRepository emailVerificationRepository,
            EmailService emailService) {
        this.emailVerificationRepository = emailVerificationRepository;
        this.emailService = emailService;
    }


    @Transactional
    public void sendOtp(String email) {

        LocalDateTime now = LocalDateTime.now();

        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElse(null);

        if (verification != null) {

            if (verification.getLastSentAt() != null &&
                    verification.getLastSentAt().isAfter(now.minusSeconds(60))) {
                throw new IllegalStateException(
                        "Please wait 60 seconds before requesting another OTP."
                );
            }

        } else {
            verification = new EmailVerification();
            verification.setEmail(email);
        }

        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNumber);

        verification.setOtp(otp);
        verification.setExpiresAt(now.plusMinutes(5));
        verification.setAttempts(0);
        verification.setLastSentAt(now);

        emailVerificationRepository.save(verification);

        emailService.sendEmail(
                email,
                "Trade Logger - Email Verification",
                "Your verification code is: " + otp
                        + "\n\nThis code expires in 5 minutes."
                        + "\nIf you did not request this code, please ignore this email."
        );
    }

    @Transactional
    public boolean verifyOtp(String email, String otp) {

        EmailVerification verification = emailVerificationRepository.findByEmail(email)
                .orElse(null);

        if (verification == null) {
            return false;
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            emailVerificationRepository.deleteByEmail(email);
            return false;
        }

        if (verification.getAttempts() >= 5) {
            emailVerificationRepository.deleteByEmail(email);
            return false;
        }

        if (!verification.getOtp().equals(otp)) {
            verification.setAttempts(verification.getAttempts() + 1);
            emailVerificationRepository.save(verification);
            return false;
        }

        emailVerificationRepository.deleteByEmail(email);
        return true;
    }

}
