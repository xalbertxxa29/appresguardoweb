document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INICIALIZACIÓN ---
    // Asegúrate de que tu archivo firebase-config.js se cargue primero en el HTML.
    // Este inicializa 'firebase'.
    const auth = firebase.auth();

    // --- 2. SELECCIÓN DE ELEMENTOS DEL DOM ---
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.spinner');
    const errorMessageDiv = document.getElementById('error-message');

    // --- 3. MANEJO DEL EVENTO DE SUBMIT ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevenir el envío tradicional del formulario

        // Obtener los valores y limpiar espacios
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Validar que los campos no estén vacíos
        if (!email || !password) {
            mostrarError("Por favor, complete todos los campos.");
            return;
        }

        // Iniciar el proceso de login
        iniciarCarga();

        // --- 4. AUTENTICACIÓN CON FIREBASE ---
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Inicio de sesión exitoso
                console.log("Inicio de sesión exitoso:", userCredential.user);
                
                // Redirigir al usuario al menú principal o dashboard
                window.location.href = 'menu.html'; 
            })
            .catch((error) => {
                // Manejo de errores de Firebase
                const errorCode = error.code;
                console.error("Error de autenticación:", errorCode);
                
                let mensaje;
                switch (errorCode) {
                    case 'auth/user-not-found':
                        mensaje = "No se encontró ningún usuario con ese correo electrónico.";
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
            })
            .finally(() => {
                // Detener la carga, sin importar si fue exitoso o fallido
                detenerCarga();
            });
    });

    // --- 5. FUNCIONES AUXILIARES ---
    function iniciarCarga() {
        loginBtn.disabled = true;
        btnText.hidden = true;
        spinner.hidden = false;
        errorMessageDiv.hidden = true; // Ocultar errores previos
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