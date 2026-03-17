// 1. Variáveis de estado
const licaoId = localStorage.getItem('licaoAtualId');
const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));

if (!licaoId || !usuario) {
    window.location.href = 'dashboard.html';
}

// 2. Carregar dados da lição ao abrir a página
async function carregarDadosLicao() {
    try {
        const response = await fetch(`/api/licao/${licaoId}`);
        const data = await response.json();

        document.getElementById('titulo-licao').innerText = data.titulo;
        document.getElementById('pergunta-texto').innerText = data.pergunta;
        document.getElementById('player-audio').src = data.audio;
    } catch (err) {
        console.error("Erro ao carregar lição:", err);
    }
}

// 3. Função de Áudio (Requisito: Clicar para escutar)
function tocarAudio() {
    const player = document.getElementById('player-audio');
    if (player.src) {
        player.play();
    } else {
        alert("Áudio não disponível.");
    }
}

// 4. Finalizar e Validar (NF6.1, 6.2 e 6.3)
async function finalizarExercicio() {
    const resposta = document.getElementById('resposta-aluno').value.trim();
    const feedbackArea = document.getElementById('feedback-area');

    // NF6.1: Restrição - Não pode deixar em branco
    if (resposta === "") {
        feedbackArea.style.color = "orange";
        feedbackArea.innerText = "⚠️ Por favor, preencha o campo antes de concluir.";
        return;
    }

    try {
        const response = await fetch('/api/validar-resposta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioEmail: usuario.email,
                licaoId: licaoId,
                respostaUsuario: resposta
            })
        });

        const data = await response.json();

        // NF6.2 e 6.3: Receber feedback e pontuação
        if (data.acertou) {
            feedbackArea.style.color = "#58cc02";
            feedbackArea.innerHTML = `✅ ${data.feedback} <br> +${data.pontos} pontos adicionados!`;
            
            // Atualiza os pontos no localStorage para a Dashboard refletir a mudança
            usuario.pontos = (usuario.pontos || 0) + data.pontos;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuario));

            // Bloqueia o input para evitar envios duplicados
            document.getElementById('resposta-aluno').disabled = true;
        } else {
            feedbackArea.style.color = "red";
            feedbackArea.innerText = `❌ ${data.feedback}`;
        }
    } catch (err) {
        feedbackArea.innerText = "Erro ao validar resposta.";
    }
}

function voltarParaDashboard() {
    window.location.href = 'dashboard.html';
}

carregarDadosLicao();