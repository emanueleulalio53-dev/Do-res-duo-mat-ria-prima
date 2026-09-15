// ---------- Dados ----------
const categoriasLabel = {
    madeira: "Madeira e Derivados",
    mineral: "Minerais e Construção",
    organico: "Orgânicos e Biomassa",
    plastico: "Polímeros e Plásticos"
};

const aplicacaoPorCategoria = {
    madeira: "Fabricação de painéis, briquetes ou compostagem industrial",
    mineral: "Produção de agregados, pré-moldados ou pavimentação",
    organico: "Produção de biogás, compostagem ou ração animal",
    plastico: "Injeção, extrusão ou reciclagem mecânica"
};

let oportunidadesAtivas = [
    {
        residuo: "Serragem e Cavacos de Madeira",
        quantidade: "12,5 toneladas/mês",
        localizacao: "Picos - PI",
        aplicacao: "Fabricação de painéis aglomerados MDF e briquetes",
        status: "Disponível para Coleta"
    },
    {
        residuo: "Aparas de Plástico PEAD Granulado",
        quantidade: "3,8 toneladas/mês",
        localizacao: "Teresina - PI",
        aplicacao: "Injeção de tubulações rígidas e caixas industriais",
        status: "Disponível para Coleta"
    },
    {
        residuo: "Bagaço de Caju e Resíduos Orgânicos",
        quantidade: "18 toneladas/mês",
        localizacao: "Parnaíba - PI",
        aplicacao: "Produção de biogás e compostagem em escala",
        status: "Disponível para Coleta"
    }
];

// ---------- Toasts ----------
function showToast(title, message, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<strong>${title}</strong>${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('leaving');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4500);
}

// ---------- Painel de oportunidades ----------
function carregarOportunidades(destacarUltimo = false) {
    const painel = document.getElementById('painel-oportunidades');
    if (!painel) return;
    painel.innerHTML = '';

    oportunidadesAtivas.forEach((item, index) => {
        const card = document.createElement('div');
        const ehUltimo = destacarUltimo && index === oportunidadesAtivas.length - 1;
        card.className = 'card-oportunidade reveal in-view' + (ehUltimo ? ' card-novo' : '');

        card.innerHTML = `
            <p><strong>Resíduo:</strong> ${item.residuo}</p>
            <p><strong>Quantidade:</strong> ${item.quantidade}</p>
            <p><strong>Localização:</strong> ${item.localizacao}</p>
            <p><strong>Aplicação Direta:</strong> ${item.aplicacao}</p>
            <span class="badge badge-status mt-4">${item.status}</span>
            <button class="btn btn-primary w-100 mt-4" type="button">Solicitar Conexão</button>
        `;

        card.querySelector('button').addEventListener('click', () => solicitarContato(item.residuo, card));
        painel.appendChild(card);
    });
}

function solicitarContato(residuo, card) {
    const btn = card.querySelector('button');
    btn.textContent = 'Conexão Solicitada ✓';
    btn.disabled = true;
    btn.classList.add('btn-success');
    showToast(
        "Solicitação registrada!",
        `A empresa detentora de "${residuo}" receberá seus dados para alinhar a transferência.`,
        "success"
    );
}

// ---------- Validação simples de formulário ----------
function validarCampos(campos) {
    let valido = true;
    campos.forEach(campo => {
        const vazio = !campo.value || !campo.value.toString().trim();
        campo.classList.toggle('field-error', vazio);
        if (vazio) valido = false;
    });
    return valido;
}

// ---------- Formulário de cadastro ----------
const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
    formCadastro.addEventListener('submit', function (event) {
        event.preventDefault();

        const campos = [
            'cad-empresa', 'cad-residuo', 'cad-categoria',
            'cad-quantidade', 'cad-unidade', 'cad-localizacao',
            'cad-frequencia', 'cad-descricao'
        ].map(id => document.getElementById(id));

        if (!validarCampos(campos)) {
            showToast("Verifique o formulário", "Preencha todos os campos obrigatórios em destaque.", "error");
            return;
        }

        const [empresa, residuo, categoria, quantidade, unidade, localizacao, frequencia] =
            campos.slice(0, 7).map(c => c.value);

        const unidadeLabel = { kg: "Kg", ton: "toneladas", litros: "litros" }[unidade];

        oportunidadesAtivas.push({
            residuo: `${residuo} (${empresa})`,
            quantidade: `${quantidade} ${unidadeLabel}/${frequencia.toLowerCase()}`,
            localizacao: localizacao,
            aplicacao: aplicacaoPorCategoria[categoria] || "Potencial de reaproveitamento em análise",
            status: "Disponível para Coleta"
        });

        carregarOportunidades(true);

        showToast(
            "Resíduo cadastrado com sucesso!",
            "Nosso algoritmo começará a buscar empresas interessadas no seu insumo imediatamente.",
            "success"
        );

        this.reset();
        campos.forEach(c => c.classList.remove('field-error'));

        document.getElementById('oportunidades').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// ---------- Formulário de busca / match ----------
const formBusca = document.getElementById('form-busca');
if (formBusca) {
    formBusca.addEventListener('submit', function (event) {
        event.preventDefault();

        const categoriaSelect = document.getElementById('categoria-busca');
        const cidadeInput = document.getElementById('cidade-busca');

        if (!validarCampos([categoriaSelect, cidadeInput])) {
            showToast("Verifique a busca", "Selecione uma categoria e informe a cidade ou região.", "error");
            return;
        }

        const categoria = categoriaSelect.value;
        const cidade = cidadeInput.value.trim();

        let seed = 0;
        for (const char of (categoria + cidade).toLowerCase()) {
            seed += char.charCodeAt(0);
        }
        const percentual = 72 + (seed % 26);

        const matchDisplay = document.getElementById('match-resultado');
        const matchPercent = document.getElementById('match-percent');
        const matchCategoria = document.getElementById('match-categoria');
        const matchCidade = document.getElementById('match-cidade');
        const aviso = document.getElementById('match-aviso-texto');

        matchDisplay.classList.remove('hidden');

        matchCategoria.textContent = categoriasLabel[categoria];
        matchCidade.textContent = cidade;

        let contador = 0;
        matchPercent.textContent = '0%';
        const intervalo = setInterval(() => {
            contador += Math.ceil(percentual / 20);
            if (contador >= percentual) {
                contador = percentual;
                clearInterval(intervalo);
            }
            matchPercent.textContent = `${contador}%`;
        }, 60);

        if (percentual >= 85) {
            aviso.textContent = `Alta compatibilidade detectada: a composição e o volume de ${categoriasLabel[categoria].toLowerCase()} disponível atendem aos requisitos técnicos da sua planta em ${cidade}.`;
        } else {
            aviso.textContent = `Compatibilidade moderada: existem opções de ${categoriasLabel[categoria].toLowerCase()} próximas de ${cidade}, mas recomendamos validar volume e logística com o fornecedor.`;
        }

        matchDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });

        showToast("Busca concluída", `Compatibilidade de ${percentual}% encontrada para ${cidade}.`, "info");
    });
}

// ---------- Menu mobile ----------
const menuToggle = document.getElementById('menu-toggle');
const navElement = document.querySelector('header nav');

if (menuToggle && navElement) {
    menuToggle.addEventListener('click', () => {
        const aberto = navElement.classList.toggle('open');
        menuToggle.classList.toggle('open', aberto);
        menuToggle.setAttribute('aria-expanded', aberto);
        menuToggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navElement.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

// ---------- Header effect ao rolar ----------
const header = document.getElementById('header');
const scrollTopBtn = document.getElementById('scroll-top');

function handleScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
}
window.addEventListener('scroll', handleScroll, { passive: true });

// ---------- Scroll to top ----------
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ---------- Cursor personalizado ----------
const cursor = document.getElementById('custom-cursor');
const cursorDot = document.getElementById('cursor-dot');

if (cursor && cursorDot && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = `${e.clientX}px`;
        cursorDot.style.top = `${e.clientY}px`;
    });

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.18;
        cursorY += (mouseY - cursorY) * 0.18;
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const interativos = document.querySelectorAll('a, button, input, select, textarea, .card-step, .card-exemplo, .card-oportunidade, .fluxo-item, .impacto-card');
    interativos.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// ---------- Partículas flutuantes ----------
const canvas = document.getElementById('particles-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particlesCount = 70;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const coresVerdes = ['rgba(34,197,94,', 'rgba(74,222,128,', 'rgba(134,239,172,'];

    class Particula {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.cor = coresVerdes[Math.floor(Math.random() * coresVerdes.length)];
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.cor + this.opacity + ')';
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < particlesCount; i++) {
            particles.push(new Particula());
        }
    }
    initParticles();

    function conectaParticulas() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distancia = Math.sqrt(dx * dx + dy * dy);
                if (distancia < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(34,197,94,${0.1 * (1 - distancia / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        conectaParticulas();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

// ---------- Scrollspy ----------
function iniciarScrollspy() {
    const secoes = ['como-funciona', 'oportunidades', 'estatisticas', 'buscar', 'cadastrar']
        .map(id => document.getElementById(id))
        .filter(Boolean);

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

    secoes.forEach(secao => observer.observe(secao));
}

// ---------- Scroll reveal ----------
function iniciarReveal() {
    const alvos = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    alvos.forEach(alvo => observer.observe(alvo));
}

// ---------- Contadores animados ----------
function formatarNumero(valor, decimais, moeda) {
    if (valor >= 1000000) {
        return moeda + (valor / 1000000).toFixed(1) + 'M';
    }
    if (valor >= 1000) {
        return moeda + (valor / 1000).toFixed(0) + 'k';
    }
    return (moeda || '') + valor.toFixed(decimais);
}

function iniciarContadores() {
    const numeros = document.querySelectorAll('.impacto-numero[data-target]');

    const anima = (elemento) => {
        const alvo = parseFloat(elemento.dataset.target);
        const decimais = parseInt(elemento.dataset.decimals || "0", 10);
        const sufixo = elemento.dataset.suffix || "";
        const moeda = elemento.dataset.currency || "";
        const duracao = 1600;
        const inicio = performance.now();

        function passo(agora) {
            const elapsed = agora - inicio;
            const progresso = Math.min(elapsed / duracao, 1);
            const eased = 1 - Math.pow(1 - progresso, 3);
            const valorAtual = alvo * eased;
            elemento.textContent = formatarNumero(valorAtual, decimais, moeda) + sufixo;
            if (progresso < 1) requestAnimationFrame(passo);
        }
        requestAnimationFrame(passo);
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                anima(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    numeros.forEach(numero => observer.observe(numero));
}

// ---------- Gráfico de barras animado ----------
function iniciarGraficos() {
    const barras = document.querySelectorAll('.bar-fill');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.setProperty('--target-width', entry.target.dataset.target + '%');
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    barras.forEach(barra => observer.observe(barra));
}

// ---------- Inicialização ----------
document.addEventListener('DOMContentLoaded', () => {
    carregarOportunidades();
    iniciarScrollspy();
    iniciarReveal();
    iniciarContadores();
    iniciarGraficos();
    handleScroll();
});