// Sistema de Login do Painel Administrativo

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');

    // Verificar se já está logado
    const token = localStorage.getItem('admin_token');
    if (token) {
        // Verificar se o token ainda é válido
        fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (res.ok) {
                window.location.href = '/admin/dashboard';
            }
        })
        .catch(() => {
            localStorage.removeItem('admin_token');
        });
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        errorDiv.style.display = 'none';

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                window.location.href = '/admin/dashboard';
            } else {
                errorDiv.textContent = data.error || 'Erro ao fazer login';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'Erro de conexão. Tente novamente.';
            errorDiv.style.display = 'block';
        }
    });
});

