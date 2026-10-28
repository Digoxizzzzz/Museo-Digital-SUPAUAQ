/**
 * constructor-cartas.js
 * Módulo encargado de:
 * 1. Definir el constructor/clase para crear cada tarjeta (carta) de documento.
 * 2. Cargar la información desde un archivo JSON.
 * 3. Renderizar automáticamente las cartas en el contenedor de la galería.
 */

/**
 * Constructor de una Tarjeta de Documento individual
 */
class DocumentCard {
  /**
   * @param {Object} data - Datos del documento provenientes del JSON
   * @param {string} data.titulo - Título del documento
   * @param {string[]|string} data.detalles - Lista o descripción de detalles
   * @param {string} [data.pdf] - Ruta relativa o URL al archivo PDF
   * @param {string} [data.archivoPdf] - Alternativa para la ruta del PDF
   */
  constructor(data) {
    this.titulo = data.titulo || 'Documento sin título';
    this.pdf = data.pdf || data.archivoPdf || data.url || '#';

    // Normalizar detalles en un array de cadenas
    if (Array.isArray(data.detalles)) {
      this.detalles = data.detalles;
    } else if (typeof data.detalles === 'string') {
      this.detalles = [data.detalles];
    } else {
      // Si vienen propiedades individuales como descripcion, fecha, etc.
      this.detalles = [data.descripcion, data.fecha, data.info].filter(Boolean);
    }
  }

  /**
   * Genera el elemento HTML (DOM) correspondiente a la tarjeta
   * @returns {HTMLElement} <article class="document-card">...</article>
   */
  crearElemento() {
    const card = document.createElement('article');
    card.className = 'document-card';

    // 1. Contenedor de la vista previa interactiva (PDF canvas)
    const previewBox = document.createElement('div');
    previewBox.className = 'card-preview-box';
    previewBox.setAttribute('role', 'button');
    previewBox.setAttribute('tabindex', '0');
    previewBox.setAttribute('aria-label', `Abrir documento "${this.titulo}" en visor`);

    const canvas = document.createElement('canvas');
    canvas.className = 'card-preview-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `Vista previa de la primera página del documento "${this.titulo}"`);
    previewBox.appendChild(canvas);

    // 2. Título de la tarjeta
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = this.titulo;

    // 3. Detalles del documento
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'card-details';
    this.detalles.forEach(texto => {
      const p = document.createElement('p');
      p.textContent = texto;
      detailsContainer.appendChild(p);
    });

    // 4. Enlace para consultar/descargar PDF
    const link = document.createElement('a');
    link.className = 'card-pdf-link';
    link.href = this.pdf;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Consultar documento PDF: ${this.titulo}`);
    link.textContent = 'Ver documento PDF';

    // Ensamblar tarjeta
    card.appendChild(previewBox);
    card.appendChild(title);
    card.appendChild(detailsContainer);
    card.appendChild(link);

    return card;
  }
}

/**
 * Constructor / Administrador de la Galería
 * Realiza la petición al JSON y genera dinámicamente cada tarjeta
 */
class GaleriaDocumentos {
  /**
   * @param {Object} config
   * @param {string|HTMLElement} config.contenedor - Selector o elemento donde se insertan las cartas
   * @param {string} config.jsonUrl - Ruta del archivo JSON
   * @param {Array} [config.datosRespaldo] - Datos opcionales por si fetch se bloquea localmente (protocolo file://)
   */
  constructor({ contenedor, jsonUrl = 'data/documentos.json', datosRespaldo = null }) {
    this.contenedor = typeof contenedor === 'string'
      ? document.querySelector(contenedor)
      : contenedor;
    this.jsonUrl = jsonUrl;
    this.datosRespaldo = datosRespaldo;
    this.documentos = [];
  }

  /**
   * Carga los datos del JSON y genera las tarjetas en el DOM
   */
  async inicializar() {
    if (!this.contenedor) {
      console.error('No se encontró el contenedor para la galería de documentos.');
      return;
    }

    try {
      const response = await fetch(this.jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} al leer ${this.jsonUrl}`);
      }
      this.documentos = await response.json();
    } catch (error) {
      console.warn(
        `Aviso: No fue posible cargar "${this.jsonUrl}" mediante fetch (${error.message}). ` +
        `Si estás abriendo el archivo localmente como file:///, se utilizarán los datos locales de respaldo.`
      );
      if (this.datosRespaldo && Array.isArray(this.datosRespaldo)) {
        this.documentos = this.datosRespaldo;
      }
    }

    this.render();
  }

  /**
   * Itera sobre la lista de documentos y los dibuja en el contenedor
   */
  render() {
    this.contenedor.innerHTML = '';

    if (!this.documentos || this.documentos.length === 0) {
      this.contenedor.innerHTML = '<p class="sin-documentos">No hay documentos disponibles en este momento.</p>';
      return;
    }

    this.documentos.forEach(docData => {
      // Se utiliza el constructor para cada carta
      const tarjeta = new DocumentCard(docData);
      const elementoHtml = tarjeta.crearElemento();
      this.contenedor.appendChild(elementoHtml);
    });

    // Notificar que las cartas han sido insertadas en el DOM
    document.dispatchEvent(new CustomEvent('cartasRenderizadas', {
      detail: { total: this.documentos.length }
    }));
  }
}

// Exportar globalmente para uso en navegador
window.DocumentCard = DocumentCard;
window.GaleriaDocumentos = GaleriaDocumentos;
