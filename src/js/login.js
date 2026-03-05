import { AuthManager } from './modules/auth/authManager.js';
import { Loader } from './ui/loader.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.spinner');
    const errorMessageDiv = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            mostrarError("Por favor, complete todos los campos.");
            return;
        }

        iniciarCarga();

        try {
            await AuthManager.login(email, password);
            console.log("Inicio de sesión exitoso");
            Loader.show();
            setTimeout(() => {
                window.location.href = 'menu.html';
            }, 1500);
        } catch (error) {
            const errorCode = error.code;
            console.error("Error de autenticación:", errorCode);

            let mensaje;
            switch (errorCode) {
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                    mensaje = "Credenciales incorrectas.";
                    break;
                case 'auth/wrong-password':
                    mensaje = "La contraseña es incorrecta.";
                    break;
                case 'auth/invalid-email':
                    mensaje = "El formato del correo electrónico es inválido.";
                    break;
                case 'auth/too-many-requests':
                    mensaje = "Demasiados intentos fallidos. Por favor, intente más tarde.";
                    break;
                default:
                    mensaje = "Ocurrió un error inesperado. Intente de nuevo.";
            }
            mostrarError(mensaje);
        } finally {
            detenerCarga();
        }
    });

    function iniciarCarga() {
        loginBtn.disabled = true;
        btnText.hidden = true;
        spinner.hidden = false;
        errorMessageDiv.hidden = true;
    }

    function detenerCarga() {
        loginBtn.disabled = false;
        btnText.hidden = false;
        spinner.hidden = true;
    }

    function mostrarError(mensaje) {
        errorMessageDiv.textContent = mensaje;
        errorMessageDiv.hidden = false;
    }
});
