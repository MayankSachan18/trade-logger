
package com.tradelogger.dto;

public class PendingRegistration {

    private String username;
    private String email;
    private String passwordHash;

    public PendingRegistration() {
    }

    public PendingRegistration(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }
}
