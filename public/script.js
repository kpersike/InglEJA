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
            // --- INTEGRAÇÃO REAL ---
            
            // 1. Salvamos os dados do usuário no localStorage
            // Isso permite que a Dashboard e as Lições saibam quem é o aluno
            localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));

            // 2. Feedback visual de sucesso
            feedback.style.color = "#1cb0f6"; 
            feedback.innerHTML = `<strong>Bem-vindo(a), ${data.usuario.nome}!</strong><br>Preparando suas lições...`;
            
            // 3. Redirecionamento automático após 1.5 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            // Caso o servidor retorne 401 (Senha errada) ou 400
            feedback.style.color = "red";
            feedback.innerText = data.erro || "E-mail ou senha incorretos.";
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        feedback.style.color = "red";
        feedback.innerText = "Erro de conexão com o servidor. Verifique se o node server.js está rodando.";
    }
}

