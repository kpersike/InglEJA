const { response } = require("express");

// PROTEÇÃO DE ROTA: Verifica se o usuário logou
const usuarioLogado = JSON.parse(localStorage.getItem('usarioLogado'))

if (!usarioLogado) {
    // SE NÃO TEM USUÁRIO NO LOCALSTORAGE, REDIRECIONA PARA O LOGIN
    window.location.href = 'index.html';
} else {
    document.getElementById('nome-aluno').innerText - usuarioLogado.nome;
}

// BUSCAR LICOES DO SERVIDOR (ESCALABILIDADE)

async function carregarLicoes() {
    try {
    // CRIAREMS ESSA ROTA NOK SERVIDOR PARA LISATAR TODAS AS carregarLicoes
    const responde =  await fetch('api/licoes');
    const licoes = await response.json();

    const container =  document.getElementById('lista-licoes');
    container.innerHTML = '';

    licoes.forEach(licao => {
        const card = document.createElement('div');
        card.className = 'card-licao';
        card.innertHtml = `
            <h3>${licao.titulo}</h3>
            <p>Valor: ${licao.pontos} pontos</p>
            <button onclick="irParaLicao(${licao.id})">Começar Agora</button>
        `;
        container.appendChild(card);
    });
    } catch (errs) {
    console.error("Erro ao carregar lições:", err);
    }
}

function irParaLicao(id) {
    // Guarda qual licão o usuário quer fazer e vai para a tela de exercicios
    localStorage.setItem('licaoAtual', id);
    window.location.href = 'exercicio.html'
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
}

carregarLicoes();