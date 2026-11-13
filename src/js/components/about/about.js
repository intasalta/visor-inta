/**
 * Represents a utility class to get data from various sources.
 */
class DataGetter {
  constructor() { }

  /**
   * Loads the content of a Markdown file from the specified URL and selects the specified lines.
   * @param {string} url - The URL of the Markdown file.
   * @param {number} from - The index of the first line to select.
   * @param {number} to - The index of the last line to select.
   * @returns {Promise<string>} - A promise that resolves with the selected text from the Markdown file.
   */
  loadMD(url, from, to) {
    return fetch(url)
      .then((response) => response.text())
      .then((markdown) => {
        const html = marked(markdown);
        const lines = html.split("\n");
        const selectedLines = lines.slice(from, to);
        const selectedText = selectedLines.join("\n");
        return selectedText;
      })
      .catch((error) => {
        console.error("Error loading the Markdown file:", error);
      });
  }

  /**
   * Fetches data from the specified source URL using the fetch API.
   * @param {string} source - The URL of the data source.
   * @returns {Promise<any>} - A promise that resolves with the fetched data or null if an error occurs.
   */
  async fetchData(source) {
    try {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(`An error has occurred: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to fetch data from ${source}:`, error);
      return null;
    }
  }
}

/**
 * Represents the About Us section.
 */
class AboutUs {
  constructor() {
    this.imgInDisplay = -1;
    this.thereIsAImg = false;
    this.contributors = [];
    this.tabs = [
      {
        name: "Acerca",
        id: "load-readme",
      },
      {
        name: "Funciones",
        id: "load-functions",
      }/* ,
      {
        name: 'Colaboradores',
        id: 'load-colaboradores',
      } */,
    ];
    this.dataGetter = new DataGetter();
    this.check();
  }

  /**
   * Creates the About Us modal and its content.
   */
  createModalAbout() {
    const principalContainer = new AboutUsModal();
    principalContainer.createElement(this.tabs);

    this.addReadmeContent();
    this.addFunctionsContent();
    //this.addContributorsContent();
  }

  /* *
   * Adds the contributors content to the contributors container.

  addContributorsContent() {
    this.contributors.sort((a, b) => a.login.localeCompare(b.login));
    this.contributors.forEach((contributor, i) => {
      if (contributor.login.toLowerCase() === "dependabot[bot]") {
        return;
      }
      const card = document.createElement('div');
      card.className = "contributor-card";
      card.title = "Visitar GitHub";
      card.addEventListener('click', () => {
        this.goTo(contributor.html_url);
      });

      const presentImg = document.createElement('img');
      presentImg.src = contributor.avatar_url;

      const userName = document.createElement('p');
      userName.innerHTML = contributor.login;

      presentImg.className = "contributor-img";
      userName.className = "contributor-user";

      card.appendChild(presentImg);
      card.appendChild(userName);

      const contributorContainer = document.getElementById("contributors-container");
      contributorContainer.appendChild(card);
    });
  }
 */

  /**
   * Adds the functions content to the functions container.
   */
  addFunctionsContent() {
    this.dataGetter
      .loadMD("src/docs/features.md", 2, Infinity)
      .then((selectedText) => {
        const lines = selectedText.split("\n");
        const lastIndex = lines.length - 4; // Index of the antepenultimate line

        lines.forEach((line, i) => {
          if (i > lastIndex) {
            localStorage.setItem("lastFunctionSeen", i - 3);
            return; // Ignore lines after the antepenultimate line
          }

          const divFuncion = document.createElement("div");
          divFuncion.classList.add("all-function-div");

          if (i % 2 == 0) {
            divFuncion.classList.add("even-function");
          }

          if (this.getExited != null && parseInt(this.getExited) < i) {
            divFuncion.innerHTML = `<strong>¡Nuevo! &nbsp;</strong> ${line}`;
            divFuncion.classList.add("new-function");
            this.waitForElementAndAddNoti("load-functions");
          } else {
            divFuncion.innerHTML = line;
          }

          const functionsContainer = document.getElementById(
            "functions-container",
          );
          functionsContainer.prepend(divFuncion);
        });
      });
  }

  /**
   * Adds the readme content to the readme container.
   */
  addReadmeContent() {
    const innerReadmeText = document.createElement("div");
    innerReadmeText.style.margin = "15px 20px";
    innerReadmeText.style.lineHeight = "1.5";
    innerReadmeText.style.textAlign = "justify";

    innerReadmeText.innerHTML = `
      <h3 style="margin-top: 0; color: var(--primary-color, #157DB9); text-align: center;">INTA Digital GEO (ID GEO)</h3>
      <p>
        <strong>ID GEO</strong> es el visor geoespacial del <strong>Instituto Nacional de Tecnología Agropecuaria (INTA)</strong>, desarrollado para centralizar, visualizar y consultar la información geográfica producida por los distintos nodos y estaciones experimentales del INTA distribuidos en todo el territorio nacional.
      </p>
      <p>
        Este desarrollo toma como base tecnológica la plataforma de código abierto <strong>Argenmap</strong> creada por el <strong>Instituto Geográfico Nacional (IGN)</strong>, incorporando extensiones analíticas, geoprocesos, herramientas avanzadas de consulta y adaptaciones específicas para el sector agropecuario, los recursos naturales y el ordenamiento territorial.
      </p>
      <h4 style="margin-bottom: 5px; color: var(--primary-color, #157DB9);">Funcionalidades y mejoras incorporadas:</h4>
      <ul style="margin-top: 5px; padding-left: 20px;">
        <li><strong>Capas activas y orden de superposición:</strong> panel interactivo con arrastrar y soltar (Drag & Drop), control de opacidad rápida, ocultamiento temporal, leyendas dinámicas y badge contador en tiempo real.</li>
        <li><strong>Búsqueda avanzada por atributos:</strong> constructor de filtros lógicos múltiples (AND / OR), opción de búsqueda en "Todos los campos", filtros espaciales (toda la capa, vista actual o recuadro dibujado), resaltado con auto-zoom y descarga directa en KML o GeoJSON.</li>
        <li><strong>Localizador por coordenadas (GMS / Decimal):</strong> herramienta en barra superior para posicionar puntos ingresando Grados, Minutos, Segundos o Grados Decimales, con auto-zoom y ficha informativa.</li>
        <li><strong>Zoom por ventana (+ y -):</strong> acercamiento y alejamiento dinámico trazando recuadros directamente sobre el mapa.</li>
        <li><strong>Módulo de impresión y exportación a PDF:</strong> panel con vista previa interactiva, títulos personalizados, orientación vertical/horizontal sin franjas blancas y escala cartográfica precisa.</li>
        <li><strong>Medición de distancias y áreas:</strong> control ubicado a la izquierda de la barra superior para una experiencia de usuario estable sin desplazamiento de botones.</li>
        <li><strong>Consulta interactiva (Popups):</strong> identificación rápida de atributos para capas WMS, WFS y vectoriales locales.</li>
        <li><strong>Mapas base satelitales e híbridos:</strong> integración de capas base de alta resolución para análisis territorial integral.</li>
      </ul>
    `;

    let readmeContainer = document.getElementById("readme-container");
    readmeContainer.prepend(innerReadmeText);

    let linkRepo = document.getElementById("link-to-repo");
    linkRepo.addEventListener("click", () => {
      this.goTo("https://github.com/intasalta/visor-inta");
    });
  }

  /**
   * Navigates to the specified URL.
   * @param {string} url - The URL to navigate to.
   */
  goTo(url) {
    window.open(url, "_blank");
  }

  /**
   * Shows the specified tab.
   * @param {number} tabIndex - The index of the tab to show.
   */
  showTab(tabIndex) {
    const contentToDisplay = document.querySelectorAll(".content-about-tab");
    contentToDisplay.forEach((el) =>
      el.classList.add("content-about-deactivate"),
    );
    contentToDisplay[tabIndex].classList.remove("content-about-deactivate");

    const tabsToDisplay = document.querySelectorAll(".tab");
    tabsToDisplay.forEach((el) => el.classList.remove("tab-active"));
    tabsToDisplay[tabIndex].classList.add("tab-active");
  }

  /**
   * Toggles the visibility of the About Us modal.
   */
  toggleOpen() {
    if (!this.isVisible) {
      this.createModalAbout();
      this.showTab(0);
      this.isVisible = true;
    } else {
      const aboutPopup = document.getElementById("whole-about");
      if (aboutPopup) {
        aboutPopup.remove();
      }
      this.isVisible = false;
    }
  }

  /**
   * Añade un punto de notificación al elemento especificado solo si no se mostró antes.
   * @param {string} id - El ID del elemento al que se le agrega el punto de notificación.
   */
  addNoti(id) {
    if (document.getElementById("notification-dot")) return;
    localStorage.setItem("notificationDotShown", "true");
    const target = document.getElementById(id);
    if (target) {
      const dot = document.createElement("div");
      dot.className = "notification-dot";
      dot.id = "notification-dot";
      target.appendChild(dot);
    } else {
      this.waitForElementAndAddNoti(id);
    }
  }

  /**
   * Espera a que el elemento esté en el DOM y luego agrega el punto de notificación.
   * @param {string} id - El ID del elemento objetivo.
   */
  waitForElementAndAddNoti(id) {
    const targetNode = document.getElementById(id);
    if (targetNode) {
      this.addNoti(id);
      return;
    }
    const observer = new MutationObserver((mutations, obs) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.id === id) {
            this.addNoti(id);
            obs.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Verifica si hay funciones nuevas y muestra el dot solo la primera vez que hay un cambio.
   * El dot debe mostrarse si:
   * - No hay lastFunctionSeen en localStorage
   * - O si hay una línea nueva respecto al valor guardado
   */
  check() {
    this.dataGetter.loadMD("src/docs/features.md", 2, Infinity).then((selectedText) => {
      const lines = selectedText.split("\n");
      const lastIndex = lines.length - 4;
      const lastFunctionSeen = localStorage.getItem("lastFunctionSeen");
      const notificationDotShown = localStorage.getItem("notificationDotShown") === "true";
      let newFunctionIndex = lastIndex;
      // Si nunca se guardó lastFunctionSeen o hay una línea nueva
      if (lastFunctionSeen === null || parseInt(lastFunctionSeen, 10) < newFunctionIndex) {
        // Solo mostrar el dot si no se mostró para este índice
        if (!notificationDotShown || parseInt(lastFunctionSeen, 10) < newFunctionIndex) {
          this.addNoti("developerLogo");
          localStorage.setItem("lastFunctionSeen", newFunctionIndex);
          localStorage.setItem("notificationDotShown", "true");
        }
      }
    });
  }
}

const modalAboutUs = new AboutUs();
const dataGetter = new DataGetter();

/*
(async function initializeAboutUs() {
    const contributorsData = await dataGetter.fetchData('https://api.github.com/repos/ign-argentina/argenmap/contributors');
    modalAboutUs.contributors = contributorsData;
})();
*/
