// MUSA inspiration boards. Uses the existing local MUSA data store and its reference records.
// Kept separate from the search gateway and carousel to ease a future account migration.
let selectedBoardId = "";
let boardEditor = null;
let boardDeleteId = "";

function boardMemberships(reference) {
  return Array.isArray(reference.boardIds) ? reference.boardIds : [];
}
function referencesForBoard(boardId) {
  return data.references.filter(ref => boardMemberships(ref).includes(boardId));
}
function initBoards() {
  let changed = false;
  if (!Array.isArray(data.boards)) { data.boards = []; changed = true; }
  data.boards = data.boards.filter(board => board && typeof board.id === "string" &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(board.id) && typeof board.name === "string");
  const known = () => new Set(data.boards.map(board => board.id));
  for (const ref of data.references) {
    const valid = [...new Set(boardMemberships(ref).filter(id => known().has(id)))];
    if (!Array.isArray(ref.boardIds) || valid.length !== ref.boardIds.length) {
      ref.boardIds = valid;
      changed = true;
    }
  }
  const withoutBoard = data.references.filter(ref => !ref.boardIds.length);
  if (withoutBoard.length) {
    let defaultBoard = data.boards.find(board => board.name === "Sin clasificar");
    if (!defaultBoard) {
      defaultBoard = { id: crypto.randomUUID(), name: "Sin clasificar", createdAt: new Date().toISOString() };
      data.boards.push(defaultBoard);
    }
    for (const ref of withoutBoard) ref.boardIds = [defaultBoard.id];
    changed = true;
  }
  if (changed) save();
}
function boardActionArgs(value) {
  return esc(JSON.stringify(value));
}
function boardCoverImage(ref) {
  const image = safeHref(ref.image) || safeHref(ref.backupImage);
  return image ? '<img src="' + esc(image) + '" loading="lazy" decoding="async" alt="" onerror="this.remove()">' : musaMark();
}
function renderBoardGallery(references) {
  const previews = references.slice(0,4).map(ref =>
    '<span class="board-cover-tile">' + boardCoverImage(ref) + '</span>').join("");
  return '<span class="board-cover-grid" aria-hidden="true">' + previews +
    Array.from({length:Math.max(0,4-Math.min(references.length,4))},
      () => '<span class="board-cover-tile board-cover-empty">' + musaMark() + '</span>').join("") + '</span>';
}
function renderBoardEditor() {
  if (!boardEditor) return "";
  const board = boardEditor.id && data.boards.find(item => item.id === boardEditor.id);
  const renaming = Boolean(board);
  return '<div class="board-modal-backdrop" id="board-modal" role="presentation" onclick="closeBoardEditor()">' +
    '<div class="board-modal" role="dialog" aria-modal="true" aria-labelledby="board-modal-title" onclick="event.stopPropagation()">' +
    '<div class="board-modal-top"><span class="eyebrow">MUSA / TUS TABLEROS</span>' +
    '<button type="button" class="board-close" aria-label="Cerrar" onclick="closeBoardEditor()">×</button></div>' +
    '<h2 id="board-modal-title">' + (renaming?'CAMBIAR NOMBRE':'CREAR UN TABLERO') + '</h2>' +
    '<p class="muted">' + (boardEditor.refIndex !== null ?
      'Ponle nombre a tu tablero. Esta referencia se guardará allí automáticamente.' :
      'Agrupa las imágenes que te inspiran por tema, proyecto o estilo.') + '</p>' +
    '<form onsubmit="submitBoardEditor(event)"><div class="field"><label for="board-name">Nombre del tablero</label>' +
    '<input id="board-name" name="name" maxlength="60" autocomplete="off" required placeholder="Ej. Branding editorial" value="' +
    esc(board?.name || '') + '"></div><div class="board-dialog-actions">' +
    '<button type="button" class="btn outline" onclick="closeBoardEditor()">Cancelar</button>' +
    '<button type="submit" class="btn">' + (renaming?'Guardar cambios':'Crear tablero') + '</button>' +
    '</div></form></div></div>';
}
// Board deletion is deliberate and reversible until confirmed. Saved references are never discarded.
function renderBoardDeleteConfirm() {
  if (!boardDeleteId) return "";
  const board = data.boards.find(item => item.id === boardDeleteId);
  if (!board) return "";
  const count = referencesForBoard(board.id).length;
  return '<div class="board-modal-backdrop" id="board-delete-modal" role="presentation" onclick="closeBoardDeleteConfirm()">' +
    '<div class="board-modal board-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="board-delete-title" aria-describedby="board-delete-description" onclick="event.stopPropagation()">' +
    '<div class="board-modal-top"><span class="eyebrow">MUSA / TUS TABLEROS</span>' +
    '<button type="button" class="board-close" aria-label="Cerrar sin eliminar" onclick="closeBoardDeleteConfirm()">×</button></div>' +
    '<h2 id="board-delete-title">¿ELIMINAR ESTE TABLERO?</h2>' +
    '<p id="board-delete-description">Vas a eliminar <strong>«' + esc(board.name) + '»</strong>. ' +
    (count ? 'Sus ' + count + ' ' + (count === 1 ? 'referencia guardada' : 'referencias guardadas') +
      ' no se perderán: las que no estén en otros tableros pasarán a «Sin clasificar».' :
      'Este tablero no tiene referencias guardadas.') + '</p>' +
    '<div class="board-dialog-actions">' +
    '<button id="board-delete-cancel" type="button" class="btn outline" onclick="closeBoardDeleteConfirm()">Cancelar</button>' +
    '<button type="button" class="btn board-confirm-delete" onclick="confirmDeleteBoard()">Eliminar tablero</button>' +
    '</div></div></div>';
}
function openBoardDeleteConfirm(boardId) {
  if (!data.boards.some(board => board.id === boardId)) return;
  boardEditor = null;
  boardDeleteId = boardId;
  render();
  document.getElementById("board-delete-cancel")?.focus?.();
}
function closeBoardDeleteConfirm() {
  if (!boardDeleteId) return;
  boardDeleteId = "";
  render();
}
function confirmDeleteBoard() {
  const board = data.boards.find(item => item.id === boardDeleteId);
  if (!board) { boardDeleteId = ""; render(); return; }
  const snapshot = JSON.stringify({boards:data.boards,references:data.references});
  const deletedId = board.id;
  data.boards = data.boards.filter(item => item.id !== deletedId);
  let unclassified = data.boards.find(item => item.name === "Sin clasificar");
  for (const reference of data.references) {
    if (!boardMemberships(reference).includes(deletedId)) continue;
    const remaining = [...new Set(boardMemberships(reference).filter(id => id !== deletedId))];
    if (!remaining.length) {
      if (!unclassified) {
        unclassified = {id:crypto.randomUUID(),name:"Sin clasificar",createdAt:new Date().toISOString()};
        data.boards.push(unclassified);
      }
      remaining.push(unclassified.id);
    }
    reference.boardIds = remaining;
  }
  if (!save()) {
    const original = JSON.parse(snapshot);
    data.boards = original.boards;
    data.references = original.references;
    return;
  }
  if (selectedBoardId === deletedId) selectedBoardId = "";
  boardDeleteId = "";
  boardEditor = null;
  toast("Tablero eliminado. Tus referencias siguen guardadas.");
  render();
}
function openBoardEditor(id = "", refIndex = null) {
  if (id && !data.boards.some(board => board.id === id)) return;
  boardDeleteId = "";
  boardEditor = { id, refIndex: Number.isInteger(refIndex) && refIndex >= 0 ? refIndex : null };
  render();
  document.getElementById("board-name")?.focus?.();
}
function closeBoardEditor() {
  if (!boardEditor) return;
  boardEditor = null;
  render();
}
function submitBoardEditor(event) {
  event.preventDefault();
  if (!boardEditor) return;
  const input = document.getElementById("board-name");
  const name = String(input?.value || "").trim().replace(/\s+/g," ");
  if (!name || name.length > 60) { toast("Elige un nombre de hasta 60 caracteres"); input?.focus?.(); return; }
  if (data.boards.some(board => board.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es") &&
      board.id !== boardEditor.id)) { toast("Ya tienes un tablero con ese nombre"); input?.focus?.(); return; }
  const editing = boardEditor;
  const snapshot = JSON.stringify({ boards:data.boards, references:data.references });
  let board;
  if (editing.id) {
    board = data.boards.find(item => item.id === editing.id);
    if (!board) return;
    board.name = name;
  } else {
    board = { id:crypto.randomUUID(), name, createdAt:new Date().toISOString() };
    data.boards.unshift(board);
  }
  if (editing.refIndex !== null) addReferenceToBoard(editing.refIndex,board.id);
  if (!save()) {
    const original = JSON.parse(snapshot);
    data.boards = original.boards;
    data.references = original.references;
    return;
  }
  boardEditor = null;
  toast(editing.id ? "Tablero actualizado" : "Tablero creado");
  render();
}
function addReferenceToBoard(index, boardId) {
  const ref = inspiration.items[index];
  if (!ref || !data.boards.some(board => board.id === boardId)) return false;
  let saved = data.references.find(item => referenceKey(item) === referenceKey(ref));
  if (!saved) {
    saved = {...ref,boardIds:[],savedAt:new Date().toISOString()};
    data.references.unshift(saved);
  }
  if (!boardMemberships(saved).includes(boardId)) {
    saved.boardIds = [...boardMemberships(saved), boardId];
    return true;
  }
  return false;
}
function saveReferenceToBoard(index, boardId) {
  if (!data.boards.some(board => board.id === boardId)) return;
  const snapshot = JSON.stringify(data.references);
  const added = addReferenceToBoard(index,boardId);
  if (!added) { toast("Esta referencia ya está en ese tablero"); return; }
  if (!save()) {data.references = JSON.parse(snapshot);return;}
  const board = data.boards.find(item => item.id === boardId);
  toast("Guardada en " + board.name);
  render();
}
function removeReferenceFromBoard(index, boardId) {
  const ref = data.references[index];
  if (!ref || !boardMemberships(ref).includes(boardId)) return;
  const snapshot = JSON.stringify(data.references);
  ref.boardIds = ref.boardIds.filter(id => id !== boardId);
  if (!ref.boardIds.length) data.references.splice(index,1);
  if (!save()) {data.references = JSON.parse(snapshot);return;}
  toast("Referencia retirada del tablero");
  render();
}
function openBoard(boardId) {
  if (!data.boards.some(board => board.id === boardId)) return;
  selectedBoardId = boardId;
  render();
}
function closeBoard() {selectedBoardId = "";render();}
function renderBoards() {
  const currentBoard = data.boards.find(board => board.id === selectedBoardId);
  const header = '<div class="sectionhead board-heading"><div><span class="eyebrow">TU ARCHIVO VISUAL</span><h2>TUS TABLEROS DE INSPIRACIÓN</h2></div>' +
    '<button type="button" class="btn secondary" onclick="openBoardEditor()">+ Crear tablero</button></div>';
  let content;
  if (currentBoard) {
    const references = data.references.map((r,i) => ({r,i})).filter(({r}) =>
      boardMemberships(r).includes(currentBoard.id));
    content = '<div class="board-view"><div class="board-view-bar"><button class="board-back" type="button" onclick="closeBoard()">← Todos los tableros</button>' +
      '<div class="board-view-actions"><button type="button" class="btn outline" onclick="openBoardEditor(' + boardActionArgs(currentBoard.id) + ')">Renombrar tablero</button>' +
      '<button type="button" class="btn board-delete" onclick="openBoardDeleteConfirm(' + boardActionArgs(currentBoard.id) + ')">Eliminar tablero</button></div></div>' +
      '<h3>' + esc(currentBoard.name) + '</h3><p class="muted">' + references.length + ' referencias guardadas</p>' +
      (references.length ? '<div class="ref-grid">' + references.map(({r,i}) => refCard(r,i,true,currentBoard.id)).join("") + '</div>' :
        '<div class="board-empty"><p>Este tablero todavía no tiene imágenes. Busca referencias y guárdalas aquí.</p></div>') + '</div>';
  } else if (data.boards.length) {
    content = '<div class="boards-grid">' + data.boards.map(board => {
      const refs = referencesForBoard(board.id);
      return '<article class="board-tile"><button type="button" class="board-open" onclick="openBoard(' + boardActionArgs(board.id) +
        ')" aria-label="Abrir tablero ' + esc(board.name) + '">' + renderBoardGallery(refs) +
        '<span class="board-title">' + esc(board.name) + '</span><span class="board-count">' + refs.length +
        ' referencias</span></button><button type="button" class="board-rename" onclick="openBoardEditor(' +
        boardActionArgs(board.id) + ')" aria-label="Renombrar ' + esc(board.name) + '">Renombrar ✎</button>' +
        '<button type="button" class="board-tile-delete" onclick="openBoardDeleteConfirm(' + boardActionArgs(board.id) + ')" aria-label="Eliminar tablero ' + esc(board.name) + '">Eliminar</button></article>';
    }).join("") + '</div>';
  } else {
    content = '<div class="board-empty"><div class="board-empty-mark">' + musaMark() + '</div>' +
      '<h3>TUS IDEAS, BIEN ORGANIZADAS.</h3><p>Crea tu primer tablero y reúne referencias por estilo, técnica o proyecto.</p>' +
      '<button class="btn" type="button" onclick="openBoardEditor()">Crear mi primer tablero ↗</button></div>';
  }
  return '<section class="board-section" aria-label="Tableros de inspiración">' + header + content + '</section>' + renderBoardEditor() + renderBoardDeleteConfirm();
}
// The global navigation has its own keyboard handler; dialogs trap focus independently.
document.addEventListener?.("keydown", event => {
  if (!boardEditor && !boardDeleteId) return;
  if (event.key === "Escape") { event.preventDefault(); if (boardDeleteId) closeBoardDeleteConfirm(); else closeBoardEditor(); return; }
  if (event.key !== "Tab") return;
  const dialog = document.getElementById(boardDeleteId ? "board-delete-modal" : "board-modal");
  const nodes = [...(dialog?.querySelectorAll?.("button, input") || [])].filter(el => !el.disabled);
  if (!nodes.length) return;
  const first = nodes[0],last = nodes[nodes.length-1];
  if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
  else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
});
