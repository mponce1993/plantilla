// main.js - Plantilla de Invitación de Boda Estilo Periódico

let appConfig = null;
let timerInterval = null;

// Icons for timeline SVG map
const ICON_SVG = {
  church: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L9 5v4H4v13h16V9h-5V5l-3-3zm1 18h-2v-4h2v4zm-1-8a2 2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>`,
  rings: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 6a5 5 0 1 0 3.75 8.29 5 5 0 1 0 4.5 0A5 5 0 1 0 8 6zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm8 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>`,
  dance: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-3 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4.5 1h-3l-2.5 6 2 4.5h2.5l-1.5-4 2.5-3.5v-3zm-6 0h-2v5h2v-5z"/></svg>`,
  dinner: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.55 3.89 3.56 4.23L5 22h2l1.25-7h1.5L11 22h2l-1.56-8.77C13.45 12.89 15 11.12 15 9V2h-2v7h-2zm7-7v20h2V12h2V2h-4z"/></svg>`,
  party: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L2 22h20L12 2zm0 4.5l5.5 11h-11L12 6.5zM12 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfiguration();
  checkUrlGuestParameters();
  setupAdminMode();
  setupAudioPlayer();
  setupEventListeners();
  setupLinkGenerator();
  setupTabs();
  renderAsistentesTable();
});

// Setup Secret Admin Mode Access
function setupAdminMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const btnEditor = document.getElementById('btn-open-editor');

  // URL trigger ?admin=true or ?editor=true
  if (urlParams.get('admin') === 'true' || urlParams.get('editor') === 'true') {
    if (btnEditor) btnEditor.classList.remove('hidden');
  }

  // Keyboard shortcut: Ctrl + Shift + E
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
      if (btnEditor) btnEditor.classList.toggle('hidden');
      showToast(btnEditor?.classList.contains('hidden') ? 'Modo Editor Ocultado' : 'Modo Editor Activado');
    }
  });

  // Footer secret click (3 clicks)
  const footerCredit = document.querySelector('.footer-credit');
  let clickCount = 0;
  footerCredit?.addEventListener('click', () => {
    clickCount++;
    if (clickCount >= 3) {
      if (btnEditor) btnEditor.classList.remove('hidden');
      showToast('⚙️ Modo Editor Activado');
      clickCount = 0;
    }
  });
}

// Check if URL has ?invitado=...&pases=...
function checkUrlGuestParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const invitadoParam = urlParams.get('invitado') || urlParams.get('nombre');
  const pasesParam = urlParams.get('pases') || urlParams.get('boletos');

  if (invitadoParam) {
    const box = document.getElementById('personalized-pass-box');
    const nameEl = document.getElementById('pass-guest-name');
    const countEl = document.getElementById('pass-count-text');

    if (box && nameEl) {
      nameEl.innerText = invitadoParam;
      if (pasesParam && countEl) {
        countEl.innerHTML = `Hemos reservado <strong>${pasesParam} ${pasesParam == 1 ? 'pase' : 'pases'}</strong> especialmente para ti.`;
      }
      box.classList.remove('hidden');
    }

    // Pre-fill RSVP modal
    const inputNombreRSVP = document.getElementById('rsvp-nombre');
    const inputInvitadosRSVP = document.getElementById('rsvp-invitados');

    if (inputNombreRSVP) inputNombreRSVP.value = invitadoParam;
    if (pasesParam) {
      window.currentPasesAsignados = pasesParam;
      if (inputInvitadosRSVP) {
        inputInvitadosRSVP.value = pasesParam;
        inputInvitadosRSVP.max = pasesParam;
      }
    }
  }
}

// Load config.json with fallback to localStorage draft
async function loadConfiguration() {
  try {
    const localDraft = localStorage.getItem('wedding_config_draft');
    if (localDraft) {
      appConfig = JSON.parse(localDraft);
    } else {
      const response = await fetch('./config.json');
      appConfig = await response.json();
    }
  } catch (error) {
    console.error('Error cargando config.json:', error);
  }

  if (appConfig) {
    renderData(appConfig);
    startCountdown(appConfig.fechaISO);
  }
}

// Render data from config JSON to HTML elements
function renderData(config) {
  // Metadata & Titles
  setTxt('txt-encabezado-superior', config.encabezadoSuperior || `${config.novio} & ${config.novia}`);
  setTxt('txt-titulo-periodico', config.tituloPeriodico || 'Noticia de última hora');
  setTxt('txt-fecha-header', config.fechaTextoHeader || '');
  setTxt('txt-gran-titular', config.granTitular || 'NOS CASAMOS');
  setTxt('txt-fecha-corazones', config.fechaCorazones || config.fechaTextoHeader || '');
  setTxt('txt-lugar-resumen', config.lugarResumen ? `Edición Especial - Celebración de nuestra unión en ${config.lugarResumen}` : '');

  // Photos
  if (config.imagenes) {
    setImg('img-portada', config.imagenes.portada);
    setImg('img-historia-1', config.imagenes.historia1);
    setImg('img-historia-2', config.imagenes.historia2);
    setImg('img-cuenta-regresiva', config.imagenes.cuentaRegresiva);
  }

  // Historia
  if (config.historia) {
    setTxt('txt-titulo-historia', config.historia.titulo || 'Nuestra Historia');
    setTxt('txt-historia-1', config.historia.parrafo1 || '');
    setTxt('txt-historia-2', config.historia.parrafo2 || '');
  }

  // Ceremonia Religiosa
  if (config.ceremonia) {
    setTxt('txt-ceremonia-titulo', config.ceremonia.titulo || 'Ceremonia Religiosa');
    setTxt('txt-ceremonia-hora', config.ceremonia.hora || '');
    setTxt('txt-ceremonia-lugar', config.ceremonia.lugar || '');
    setTxt('txt-ceremonia-ciudad', config.ceremonia.ciudad || '');
    setAttr('btn-ceremonia-mapa', 'href', config.ceremonia.mapaUrl || '#');
  }

  // Recepción
  if (config.recepcion) {
    setTxt('txt-recepcion-titulo', config.recepcion.titulo || 'Recepción');
    setTxt('txt-recepcion-hora', config.recepcion.hora || '');
    setTxt('txt-recepcion-lugar', config.recepcion.lugar || '');
    setTxt('txt-recepcion-ciudad', config.recepcion.ciudad || '');
    setAttr('btn-recepcion-mapa', 'href', config.recepcion.mapaUrl || '#');
  }

  // Itinerario Timeline
  renderItinerario(config.itinerario || []);

  // Nota Adultos
  setTxt('txt-nota-ninos', config.notaNinos || '');

  // Dress Code
  if (config.dressCode) {
    setTxt('txt-dress-titulo', config.dressCode.titulo || 'Dress code');
    setTxt('txt-dress-subtitulo', config.dressCode.subtitulo || 'Elegante - Formal');
    setTxt('txt-dress-ellas', config.dressCode.ellas || '');
    setTxt('txt-dress-ellos', config.dressCode.ellos || '');
    setTxt('txt-dress-nota', config.dressCode.notaColor || '');
  }

  // Sugerencia de Regalo
  if (config.regalos) {
    setTxt('txt-regalos-titulo', config.regalos.titulo || 'Sugerencia de Regalo');
    setTxt('txt-regalos-mensaje', config.regalos.mensaje || '');
    renderBancos(config.regalos.cuentas || []);
  }

  // Footer & Hearts Tag
  setTxt('txt-corazones-foot', config.fechaCorazones || '');
  setTxt('txt-footer-novios', `${config.novio} & ${config.novia}`);
}

// Render Timeline
function renderItinerario(items) {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <li class="timeline-item">
      <div class="timeline-icon-node">
        ${ICON_SVG[item.icon] || ICON_SVG.party}
      </div>
      <span class="timeline-time">${item.hora}</span>
      <span class="timeline-name">${item.titulo}</span>
    </li>
  `).join('');
}

// Render Bank Accounts Grid
function renderBancos(cuentas) {
  const container = document.getElementById('bank-accounts-container');
  if (!container) return;

  container.innerHTML = cuentas.map((cuenta, idx) => `
    <div class="bank-card">
      <h4 class="bank-holder">${cuenta.titular}</h4>
      ${cuenta.detalles.map(d => `
        <div class="bank-detail-item">
          <strong>${d.etiqueta}:</strong>
          <span>${d.valor}</span>
          <button class="btn-copy" onclick="copyToClipboard('${d.valor}', '${d.etiqueta}')">Copiar ${d.etiqueta}</button>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// Copy to clipboard helper
window.copyToClipboard = (text, label) => {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`¡${label} copiado al portapapeles!`);
  }).catch(() => {
    showToast(`Número: ${text}`);
  });
};

// Show toast alert
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2800);
}

// Live Countdown Timer
function startCountdown(targetISO) {
  if (timerInterval) clearInterval(timerInterval);
  const targetDate = new Date(targetISO || '2025-08-09T18:00:00').getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      document.getElementById('timer-days').innerText = '00';
      document.getElementById('timer-hours').innerText = '00';
      document.getElementById('timer-minutes').innerText = '00';
      document.getElementById('timer-seconds').innerText = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    setTxt('timer-days', String(days).padStart(2, '0'));
    setTxt('timer-hours', String(hours).padStart(2, '0'));
    setTxt('timer-minutes', String(minutes).padStart(2, '0'));
    setTxt('timer-seconds', String(seconds).padStart(2, '0'));
  }

  update();
  timerInterval = setInterval(update, 1000);
}

// Audio Player Setup
function setupAudioPlayer() {
  const audio = document.getElementById('audio-player');
  const btnPlay = document.getElementById('btn-play-audio');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const equalizer = document.getElementById('equalizer');

  if (appConfig?.musica?.audioUrl && audio) {
    audio.src = appConfig.musica.audioUrl;
  }

  btnPlay?.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        iconPlay?.classList.add('hidden');
        iconPause?.classList.remove('hidden');
        equalizer?.classList.remove('hidden');
      }).catch(err => console.log('Audio autoplay blocked by browser:', err));
    } else {
      audio.pause();
      iconPlay?.classList.remove('hidden');
      iconPause?.classList.add('hidden');
      equalizer?.classList.add('hidden');
    }
  });
}

// Setup Event Listeners for Modals & RSVP Form
function setupEventListeners() {
  // RSVP Modal
  const modalRsvp = document.getElementById('modal-rsvp');
  document.getElementById('btn-open-rsvp')?.addEventListener('click', () => modalRsvp.classList.remove('hidden'));
  document.getElementById('btn-close-rsvp')?.addEventListener('click', () => modalRsvp.classList.add('hidden'));

  // Submit RSVP Form (Saves in Local Storage & Opens WhatsApp)
  document.getElementById('form-rsvp')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('rsvp-nombre').value;
    const asistencia = document.getElementById('rsvp-asistencia').value;
    const invitados = document.getElementById('rsvp-invitados').value;
    const mensaje = document.getElementById('rsvp-mensaje').value;

    const pasesAsignados = window.currentPasesAsignados || invitados;
    const fechaHora = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

    // Save to local storage list
    const newRecord = {
      fecha: fechaHora,
      nombre,
      asistencia,
      pases: parseInt(invitados, 10),
      pasesAsignados: parseInt(pasesAsignados, 10),
      mensaje
    };

    const existingList = JSON.parse(localStorage.getItem('boda_lista_confirmados') || '[]');
    existingList.push(newRecord);
    localStorage.setItem('boda_lista_confirmados', JSON.stringify(existingList));

    renderAsistentesTable();

    // Prepare WhatsApp Message
    const waNum = appConfig?.whatsappRSVP || '5215500000000';
    const textMsg = `¡Hola ${appConfig?.novio} y ${appConfig?.novia}! 👋\n\nSoy *${nombre}*.\n*Asistencia:* ${asistencia}\n*Pases Asignados Originales:* ${pasesAsignados}\n*Personas Confirmadas:* ${invitados}\n*Mensaje:* ${mensaje || '¡Nos vemos pronto!'}`;
    
    const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');
    modalRsvp.classList.add('hidden');
    showToast('¡Asistencia registrada con éxito!');
  });

  // Editor Modal
  const modalEditor = document.getElementById('modal-editor');
  document.getElementById('btn-open-editor')?.addEventListener('click', () => {
    populateEditorFields();
    modalEditor.classList.remove('hidden');
  });
  document.getElementById('btn-close-editor')?.addEventListener('click', () => modalEditor.classList.add('hidden'));

  // Editor Actions
  document.getElementById('btn-save-preview')?.addEventListener('click', () => {
    saveEditorToConfig();
    modalEditor.classList.add('hidden');
    showToast('¡Cambios aplicados en pantalla!');
  });

  document.getElementById('btn-download-config')?.addEventListener('click', () => {
    saveEditorToConfig();
    downloadJsonFile(appConfig, 'config.json');
  });
}

// Populate Editor Fields from appConfig
function populateEditorFields() {
  if (!appConfig) return;
  setVal('edit-novio', appConfig.novio);
  setVal('edit-novia', appConfig.novia);
  setVal('edit-tituloPeriodico', appConfig.tituloPeriodico);
  setVal('edit-granTitular', appConfig.granTitular);
  setVal('edit-fechaTextoHeader', appConfig.fechaTextoHeader);
  setVal('edit-fechaISO', appConfig.fechaISO ? appConfig.fechaISO.substring(0, 16) : '');
  setVal('edit-whatsapp', appConfig.whatsappRSVP);
  setVal('edit-audioUrl', appConfig.musica?.audioUrl);

  setVal('edit-historia-1', appConfig.historia?.parrafo1);
  setVal('edit-historia-2', appConfig.historia?.parrafo2);

  setVal('edit-ceremonia-lugar', appConfig.ceremonia?.lugar);
  setVal('edit-ceremonia-hora', appConfig.ceremonia?.hora);
  setVal('edit-ceremonia-mapa', appConfig.ceremonia?.mapaUrl);

  setVal('edit-recepcion-lugar', appConfig.recepcion?.lugar);
  setVal('edit-recepcion-hora', appConfig.recepcion?.hora);
  setVal('edit-recepcion-mapa', appConfig.recepcion?.mapaUrl);

  if (appConfig.regalos?.cuentas?.[0]) {
    setVal('edit-banco-titular1', appConfig.regalos.cuentas[0].titular);
    setVal('edit-banco-num1', appConfig.regalos.cuentas[0].detalles.map(d => `${d.etiqueta}: ${d.valor}`).join(' | '));
  }
  if (appConfig.regalos?.cuentas?.[1]) {
    setVal('edit-banco-titular2', appConfig.regalos.cuentas[1].titular);
    setVal('edit-banco-num2', appConfig.regalos.cuentas[1].detalles.map(d => `${d.etiqueta}: ${d.valor}`).join(' | '));
  }
}

// Save Editor Input values into appConfig & localStorage
function saveEditorToConfig() {
  appConfig.novio = getVal('edit-novio') || appConfig.novio;
  appConfig.novia = getVal('edit-novia') || appConfig.novia;
  appConfig.encabezadoSuperior = `${appConfig.novio} & ${appConfig.novia}`;
  appConfig.tituloPeriodico = getVal('edit-tituloPeriodico') || appConfig.tituloPeriodico;
  appConfig.granTitular = getVal('edit-granTitular') || appConfig.granTitular;
  appConfig.fechaTextoHeader = getVal('edit-fechaTextoHeader') || appConfig.fechaTextoHeader;
  appConfig.fechaCorazones = getVal('edit-fechaTextoHeader')?.toUpperCase() || appConfig.fechaCorazones;
  appConfig.fechaISO = getVal('edit-fechaISO') ? `${getVal('edit-fechaISO')}:00` : appConfig.fechaISO;
  appConfig.whatsappRSVP = getVal('edit-whatsapp') || appConfig.whatsappRSVP;

  if (appConfig.musica) appConfig.musica.audioUrl = getVal('edit-audioUrl') || appConfig.musica.audioUrl;
  if (appConfig.historia) {
    appConfig.historia.parrafo1 = getVal('edit-historia-1') || appConfig.historia.parrafo1;
    appConfig.historia.parrafo2 = getVal('edit-historia-2') || appConfig.historia.parrafo2;
  }
  if (appConfig.ceremonia) {
    appConfig.ceremonia.lugar = getVal('edit-ceremonia-lugar') || appConfig.ceremonia.lugar;
    appConfig.ceremonia.hora = getVal('edit-ceremonia-hora') || appConfig.ceremonia.hora;
    appConfig.ceremonia.mapaUrl = getVal('edit-ceremonia-mapa') || appConfig.ceremonia.mapaUrl;
  }
  if (appConfig.recepcion) {
    appConfig.recepcion.lugar = getVal('edit-recepcion-lugar') || appConfig.recepcion.lugar;
    appConfig.recepcion.hora = getVal('edit-recepcion-hora') || appConfig.recepcion.hora;
    appConfig.recepcion.mapaUrl = getVal('edit-recepcion-mapa') || appConfig.recepcion.mapaUrl;
  }

  localStorage.setItem('wedding_config_draft', JSON.stringify(appConfig));
  renderData(appConfig);
  startCountdown(appConfig.fechaISO);
}

// Tab Switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// Download JSON file directly to computer
function downloadJsonFile(content, fileName) {
  const jsonStr = JSON.stringify(content, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// Render Attendees Table & Stats
function renderAsistentesTable() {
  const tbody = document.getElementById('asistentes-tbody');
  const statPersonas = document.getElementById('stat-total-personas');
  const statRegistros = document.getElementById('stat-total-registros');
  if (!tbody) return;

  const list = JSON.parse(localStorage.getItem('boda_lista_confirmados') || '[]');

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-table">No hay confirmaciones registradas aún. Las confirmaciones de los invitados aparecerán aquí automáticamente.</td></tr>`;
    if (statPersonas) statPersonas.innerText = '0';
    if (statRegistros) statRegistros.innerText = '0';
    return;
  }

  let totalPases = 0;
  list.forEach(item => {
    if (!item.asistencia.includes('no podré')) {
      totalPases += (item.pases || 1);
    }
  });

  if (statPersonas) statPersonas.innerText = String(totalPases);
  if (statRegistros) statRegistros.innerText = String(list.length);

  tbody.innerHTML = list.map(item => `
    <tr>
      <td>${item.fecha || '-'}</td>
      <td><strong>${item.nombre}</strong></td>
      <td><span style="color: ${item.asistencia.includes('no podré') ? '#dc3545' : '#28a745'}; font-weight: 600;">${item.asistencia}</span></td>
      <td>${item.pases} ${item.pasesAsignados ? `(de ${item.pasesAsignados})` : ''}</td>
      <td>${item.mensaje || '-'}</td>
    </tr>
  `).join('');
}

// Export Attendees List to CSV (Excel format with UTF-8 BOM)
function exportAsistentesCSV() {
  const list = JSON.parse(localStorage.getItem('boda_lista_confirmados') || '[]');
  if (list.length === 0) {
    showToast('No hay registros para exportar');
    return;
  }

  let csvContent = '\uFEFFFecha;Invitado / Familia;Estado Asistencia;Pases Confirmados;Pases Asignados;Mensaje\n';
  list.forEach(row => {
    const cleanMsg = (row.mensaje || '').replace(/;/g, ',').replace(/\n/g, ' ');
    csvContent += `"${row.fecha}";"${row.nombre}";"${row.asistencia}";"${row.pases}";"${row.pasesAsignados || row.pases}";"${cleanMsg}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `confirmaciones_boda_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('📊 Lista de asistentes descargada (CSV/Excel)');
}

// Export Attendees List to JSON
function exportAsistentesJSON() {
  const list = JSON.parse(localStorage.getItem('boda_lista_confirmados') || '[]');
  if (list.length === 0) {
    showToast('No hay registros para exportar');
    return;
  }
  downloadJsonFile(list, `confirmaciones_boda_${new Date().toISOString().slice(0, 10)}.json`);
  showToast('📥 Lista descargada en JSON');
}

// Setup Event Listeners for Export & Clear Actions
document.getElementById('btn-export-csv')?.addEventListener('click', exportAsistentesCSV);
document.getElementById('btn-export-json')?.addEventListener('click', exportAsistentesJSON);
document.getElementById('btn-clear-asistentes')?.addEventListener('click', () => {
  if (confirm('¿Estás seguro de borrar toda la lista de registrados local?')) {
    localStorage.removeItem('boda_lista_confirmados');
    renderAsistentesTable();
    showToast('Lista limpiada');
  }
});

// Setup Link Generator for couple
function setupLinkGenerator() {
  const inputNombre = document.getElementById('gen-nombre');
  const inputPases = document.getElementById('gen-pases');
  const linkResult = document.getElementById('gen-link-result');
  const msgResult = document.getElementById('gen-msg-result');

  function updateGenerator() {
    const nombre = inputNombre?.value?.trim() || 'Familia Mendoza';
    const pases = inputPases?.value || '2';

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const fullUrl = `${baseUrl}?invitado=${encodeURIComponent(nombre)}&pases=${encodeURIComponent(pases)}`;

    const novios = appConfig ? `${appConfig.novio} & ${appConfig.novia}` : 'Bruno & Andrea';
    const pasesText = pases == 1 ? '1 pase' : `${pases} pases`;

    const fullMessage = `¡Hola ${nombre}! 💌\n\nTenemos el gran honor de invitarte a nuestra boda. Hemos reservado especialmente ${pasesText} para ti.\n\nPuedes ver nuestra invitación oficial en el siguiente enlace:\n${fullUrl}\n\nCon todo nuestro cariño,\n${novios}`;

    if (linkResult) linkResult.value = fullUrl;
    if (msgResult) msgResult.value = fullMessage;
  }

  inputNombre?.addEventListener('input', updateGenerator);
  inputPases?.addEventListener('input', updateGenerator);

  document.getElementById('btn-copy-guest-link')?.addEventListener('click', () => {
    updateGenerator();
    copyToClipboard(linkResult.value, 'Enlace de Invitado');
  });

  document.getElementById('btn-copy-guest-msg')?.addEventListener('click', () => {
    updateGenerator();
    copyToClipboard(msgResult.value, 'Mensaje de WhatsApp');
  });

  updateGenerator();
}

// Utility DOM Helpers
function setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}
function getVal(id) {
  return document.getElementById(id)?.value?.trim();
}
function setImg(id, src) {
  const el = document.getElementById(id);
  if (el && src) el.src = src;
}
function setAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, val);
}
