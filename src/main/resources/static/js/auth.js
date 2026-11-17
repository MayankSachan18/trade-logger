document.addEventListener("DOMContentLoaded", () => {

    const toggleButtons = document.querySelectorAll(".toggle-password");

    toggleButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const targetId = button.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);

            if (!passwordInput) {
                return;
            }

            const isPasswordHidden = passwordInput.type === "password";

            passwordInput.type = isPasswordHidden ? "text" : "password";

            button.setAttribute(
                "aria-label",
                isPasswordHidden ? "Hide password" : "Show password"
            );

            button.classList.toggle("password-visible", isPasswordHidden);

        });

    });

});
