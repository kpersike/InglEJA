// 1. Função para trocar entre as telas de Login e Cadastro
function alternarTela() {
    const loginArea = document.getElementById('login-area');
    const cadastroArea = document.getElementById('cadastro-area');
    const feedback = document.getElementById('mensagem-feedback');

    // Limpa qualquer mensagem de erro ao trocar de tela
    feedback.innerText = "";

    if (loginArea.style.display === 'none') {
        loginArea.style.display = 'block';
        cadastroArea.style.display = 'none';
    } else {
        loginArea.style.display = 'none';
        cadastroArea.style.display = 'block';
    }
}

// 2. Lógica para Criar Nova Conta
async function fazerCadastro() {
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const senha = document.getElementById('cad-senha').value;
    const feedback = document.getElementById('mensagem-feedback');

    if (!nome || !email || !senha) {
        feedback.style.color = "blue";
        feedback.innerText = "Por favor, preencha todos os campos.";
        return;
    }

    try {
        const response = await fetch('/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            feedback.style.color = "#58cc02"; // Verde Duolingo
            feedback.innerText = "Parabéns! Conta criada com sucesso.";
            // Aguarda 2 segundos e volta para o login para o usuário entrar
            setTimeout(alternarTela, 2000);
        } else {
            feedback.style.color = "red";
            feedback.innerText = data.erro || "Erro ao cadastrar.";
        }
    } catch (error) {
        feedback.innerText = "Erro de conexão com o servidor.";
    }
}

// 3. Lógica para Entrar no Curso (Login)
async function fazerLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const feedback = document.getElementById('mensagem-feedback');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            feedback.style.color = "#1cb0f6"; // Azul Duolingo
            feedback.innerHTML = `<strong>${data.mensagem}</strong><br>Carregando suas lições...`;
            
            // Aqui futuramente redirecionaremos para a tela de lições
            // Por enquanto, vamos apenas simular:
            setTimeout(() => {
                alert("Login realizado! Próxima Sprint: Tela de Lições.");
            }, 1000);
            
        } else {
            feedback.style.color = "red";
            feedback.innerText = data.erro || "E-mail ou senha incorretos.";
        }
    } catch (error) {
        feedback.innerText = "Erro de conexão com o servidor.";
    }
}