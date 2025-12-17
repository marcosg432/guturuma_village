document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contato-form');
    
    if (!form) {
        console.error('Formulário de contato não encontrado');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Desabilitar botão durante envio
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        
        const formData = {
            name: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('telefone').value.trim() || null,
            message: document.getElementById('mensagem').value.trim()
        };
        
        // Validação básica
        if (!formData.name || !formData.email || !formData.message) {
            alert('Por favor, preencha todos os campos obrigatórios (Nome, Email e Mensagem).');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        try {
            console.log('Enviando ficha de contato:', formData);
            
            const response = await fetch('/api/contato', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                form.reset();
            } else {
                console.error('Erro na resposta:', data);
                alert(data.error || 'Erro ao enviar mensagem. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert('Erro ao enviar mensagem. Verifique sua conexão e tente novamente.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});





