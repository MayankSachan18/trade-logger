
document.addEventListener("DOMContentLoaded", async () => {

    // Load account information
    try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
            throw new Error("Unable to fetch account information.");
        }

        const user = await response.json();

        const createdDate = new Date(user.createdAt);

        const formattedDate = createdDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        // Profile overview
        document.getElementById("profileUsername").textContent = user.username;
        document.getElementById("profileEmail").textContent = user.email;
        document.getElementById("profileCreated").textContent = formattedDate;

        // Profile avatar
        document.getElementById("profileAvatar").textContent =
            user.username.charAt(0).toUpperCase();

        // Account information
        document.getElementById("accountUsername").textContent = user.username;
        document.getElementById("accountEmail").textContent = user.email;
        document.getElementById("accountCreated").textContent = formattedDate;

    } catch (error) {
        console.error("Settings error:", error);
        alert("Unable to load account information. Please refresh the page.");
    }


    // Change Password Modal
    const passwordModal = document.getElementById("passwordModal");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const closePasswordModal = document.getElementById("closePasswordModal");
    const cancelPasswordModal = document.getElementById("cancelPasswordModal");
    const changePasswordForm = document.getElementById("changePasswordForm");
    const passwordMessage = document.getElementById("passwordMessage");
    const submitPasswordBtn = document.getElementById("submitPasswordBtn");

    function openPasswordModal() {
        passwordModal.classList.add("active");
        passwordMessage.textContent = "";
        passwordMessage.className = "password-message";
    }

    function closeModal() {
        passwordModal.classList.remove("active");
        changePasswordForm.reset();
        passwordMessage.textContent = "";
        passwordMessage.className = "password-message";
    }

    changePasswordBtn.addEventListener("click", openPasswordModal);
    closePasswordModal.addEventListener("click", closeModal);
    cancelPasswordModal.addEventListener("click", closeModal);

    passwordModal.addEventListener("click", (event) => {
        if (event.target === passwordModal) {
            closeModal();
        }
    });


    // CSRF headers
    function getCsrfHeaders() {
        const token = document.querySelector('meta[name="_csrf"]')?.content;
        const header = document.querySelector('meta[name="_csrf_header"]')?.content;

        const headers = {
            "Content-Type": "application/json"
        };

        if (token && header) {
            headers[header] = token;
        }

        return headers;
    }


    // Submit Change Password Form
    changePasswordForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        passwordMessage.textContent = "";
        passwordMessage.className = "password-message";

        if (newPassword.length < 8) {
            passwordMessage.textContent =
                "New password must be at least 8 characters.";
            passwordMessage.classList.add("error");
            return;
        }

        if (newPassword !== confirmPassword) {
            passwordMessage.textContent =
                "New password and confirmation do not match.";
            passwordMessage.classList.add("error");
            return;
        }

        submitPasswordBtn.disabled = true;
        submitPasswordBtn.textContent = "Updating...";

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: getCsrfHeaders(),
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to update password.");
            }

            passwordMessage.textContent = result.message;
            passwordMessage.classList.add("success");

            changePasswordForm.reset();

        } catch (error) {
            passwordMessage.textContent = error.message;
            passwordMessage.classList.add("error");

        } finally {
            submitPasswordBtn.disabled = false;
            submitPasswordBtn.textContent = "Update Password";
        }

    });

});
