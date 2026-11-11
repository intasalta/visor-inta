/**
 * Represents a class that handles the visibility toggling of map tools buttons.
 * @class
 */
class ToolbarVisibilityToggler {
  constructor() {
    window.toolbarVisibilityToggler = this;
  }

  /**
   * Creates a button element and prepends/appends it to the right side of the map.
   *
   * @param {string} id - The ID of the button element.
   * @param {string} btnId - The ID of the parent div element.
   * @param {string} title - The title attribute of the button element.
   * @param {string} iconClass - The CSS class for the icon element.
   */
  createBtn(id, btnId, title, iconClass) {
    let elem = document.getElementById(btnId);
    if (!elem) {
      elem = document.createElement("div");
      elem.className = "leaflet-bar leaflet-control";
      elem.id = btnId;
      elem.title = title;
      elem.style = "cursor: pointer;";

      const elemIcon = document.createElement("a");
      elemIcon.id = id;
      elemIcon.innerHTML = `<span id="map-toolbar-span" class="${iconClass}" aria-hidden="true"></span>`;
      elem.appendChild(elemIcon);

      // Event listener to toggle visibility of map buttons on click
      elem.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent click event propagation
        const btnToolId =
          elem.id === "hideBtnRight"
            ? ".leaflet-top.leaflet-right"
            : ".leaflet-top.leaflet-left";
        const btnTool = document.querySelector(btnToolId);
        if (btnTool) {
          this.toggleToolbarVisibility(btnTool);
        }
      });

      // Event listener to prevent zoom on double-click
      elem.addEventListener("dblclick", (e) => {
        e.stopPropagation(); // Prevent double-click event propagation
      });
    }

    const container = document.querySelector(".leaflet-top.leaflet-right");
    if (container) {
      if (btnId === "hideBtnLeft") {
        container.prepend(elem);
      } else if (btnId === "hideBtnRight") {
        const leftBtn = document.getElementById("hideBtnLeft");
        if (leftBtn && leftBtn.parentNode === container) {
          leftBtn.after(elem);
        } else {
          container.prepend(elem);
        }
      } else {
        container.appendChild(elem);
      }
    }
  }

  /**
   * Asegura que los botones 'hideBtnLeft' y 'hideBtnRight' se mantengan siempre arriba.
   */
  ensureTopPosition() {
    const container = document.querySelector(".leaflet-top.leaflet-right");
    const leftBtn = document.getElementById("hideBtnLeft");
    const rightBtn = document.getElementById("hideBtnRight");
    if (container && leftBtn) {
      if (container.firstElementChild !== leftBtn) {
        container.prepend(leftBtn);
      }
      if (rightBtn && leftBtn.nextElementSibling !== rightBtn) {
        leftBtn.after(rightBtn);
      }
    }
  }

  /**
   * Ordena los botones de la barra superior horizontal (.leaflet-top.leaflet-left).
   * Coloca 'Medir distancia' a la izquierda de todos, seguido de Localizar por coordenadas,
   * Zoom Ventana (+ y -), y el resto de herramientas para evitar desplazamientos bruscos.
   */
  orderLeftToolbar() {
    const container = document.querySelector(".leaflet-top.leaflet-left");
    if (!container) return;

    const desiredSelectors = [
      ".leaflet-control-measure",
      "#coordinateLocator",
      "#boxZoomIn",
      "#boxZoomOut",
      ".leaflet-control-customgraticule",
      "#fullscreen",
      "#screenShoter",
      "#pdfPrinter",
      "#consultData",
    ];

    let prevElem = null;
    desiredSelectors.forEach((sel) => {
      const el = container.querySelector(sel);
      if (el) {
        if (prevElem === null) {
          if (container.firstElementChild !== el) {
            container.prepend(el);
          }
        } else {
          if (prevElem.nextElementSibling !== el) {
            prevElem.after(el);
          }
        }
        prevElem = el;
      }
    });
  }

  /**
   * Toggles the visibility of the child nodes of the selected maps buttons.
   * @param {HTMLElement} btnTool - The button tool element.
   */
  toggleToolbarVisibility(btnTool) {
    if (!btnTool) return;
    btnTool.childNodes.forEach((node) => {
      // Toggle visibility for nodes that are not "hideBtnRight" or "hideBtnLeft"
      if (node.nodeType === 1 && node.id !== "hideBtnRight" && node.id !== "hideBtnLeft") {
        node.hidden = !node.hidden;
      }
    });
  }

  /**
   * Hides or shows the toolbar based on the provided parameter.
   * @param {HTMLElement} toolbar - The toolbar element.
   * @param {boolean} show - Whether to show or hide the toolbar.
   */
  hideToolbar(toolbar, show) {
    if (!toolbar) return;
    toolbar.childNodes.forEach((node) => {
      if (node.nodeType === 1 && node.id !== "hideBtnRight" && node.id !== "hideBtnLeft") {
        node.hidden = !show;
      }
    });
  }

  /**
   * Creates the component.
   * This method creates two buttons for the map toolbar and sets the initial visibility of the toolbars.
   * @param {boolean} showToolbar - A boolean value to show the toolbar.
   */
  createComponent(showToolbar) {
    // Create the toolbar buttons
    this.createBtn(
      "map-toolbar-icon-left",
      "hideBtnLeft",
      "Esconder herramientas",
      "fa-solid fa-wrench",
    );
    this.createBtn(
      "map-toolbar-icon-right",
      "hideBtnRight",
      "Esconder herramientas de dibujo",
      "bx bxs-pencil",
    );

    const container = document.querySelector(".leaflet-top.leaflet-right");
    if (container && window.MutationObserver) {
      const observer = new MutationObserver(() => {
        this.ensureTopPosition();
      });
      observer.observe(container, { childList: true });
    }

    const leftContainer = document.querySelector(".leaflet-top.leaflet-left");
    if (leftContainer && window.MutationObserver) {
      let isOrdering = false;
      const leftObserver = new MutationObserver(() => {
        if (isOrdering) return;
        isOrdering = true;
        this.orderLeftToolbar();
        setTimeout(() => {
          isOrdering = false;
        }, 60);
      });
      leftObserver.observe(leftContainer, { childList: true });
    }

    const applyInitial = () => {
      this.ensureTopPosition();
      this.orderLeftToolbar();
      const rightToolbar = document.querySelector(".leaflet-top.leaflet-right");
      const leftToolbar = document.querySelector(".leaflet-top.leaflet-left");

      if (rightToolbar) this.hideToolbar(rightToolbar, showToolbar);
      if (leftToolbar) this.hideToolbar(leftToolbar, showToolbar);
    };

    if (document.readyState === "complete") {
      applyInitial();
    } else {
      window.addEventListener("load", applyInitial);
    }
    setTimeout(applyInitial, 200);
    setTimeout(applyInitial, 800);
    setTimeout(applyInitial, 1800);
    setTimeout(applyInitial, 3000);
  }
}
