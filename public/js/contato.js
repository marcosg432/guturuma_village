document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contato-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('telefone').value,
            message: document.getElementById('mensagem').value
        };
        
        try {
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
                alert(data.error || 'Erro ao enviar mensagem. Tente novamente.');
            }
        } catch (error) {
            alert('Erro ao enviar mensagem. Tente novamente.');
            console.error(error);
        }
    });
});





