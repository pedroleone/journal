export type Translations = {
  localeCode: string; // BCP 47 tag for date/number formatting
  nav: {
    dashboard: string;
    journal: string;
    food: string;
    notes: string;
    openJournal: string;
    openFood: string;
    openNotes: string;
    newJournalEntry: string;
    newFoodEntry: string;
    newNote: string;
    library: string;
    openLibrary: string;
    newLibraryItem: string;
    createNew: string;
  };
  journal: {
    back: string;
    selectDate: string;
    startWriting: string;
    image: string;
    saving: string;
    saved: string;
    saveFailed: string;
    offline: string;
    offlineChanges: string;
    offlineBrowse: string;
    reconnectToLoad: string;
    failedToLoadEntry: string;
    failedToLoadJournalEntry: string;
    connectionRequired: string;
    connectionRequiredDesc: string;
    newThought: string;
  };
  food: {
    quickFoodLog: string;
    whatAreYouEating: string;
    photo: string;
    oneFieldOneTap: string;
    log: string;
    logging: string;
    recentUncategorized: string;
    saved: string;
    noFoodLogsYet: string;
    photoEntry: string;
    open: string;
    browseAndOrganize: string;
    backToQuickLog: string;
    uncategorized: (count: number) => string;
    uncategorizedEntries: string;
    assignAllByDate: string;
    assigning: string;
    assign: string;
    noUncategorizedEntries: string;
    selectDate: string;
    mealSlot: string;
    noSlot: string;
    breakfast: string;
    morning_snack: string;
    lunch: string;
    afternoon_snack: string;
    dinner: string;
    midnight_snack: string;
    observation: string;
    uncategorizedSection: string;
    empty: string;
    skipped: string;
    skip: string;
    edit: string;
    add: string;
    undo: string;
    inbox: (count: number) => string;
    dayView: string;
    jumpToDate: string;
    assignToSelectedDay: (entryLabel: string) => string;
    delete: string;
    cancel: string;
    loading: string;
  };
  notes: {
    searchNotes: string;
    allTags: string;
    noNotesMatchSearch: string;
    noNotesYet: string;
    newNote: string;
    selectOrCreate: string;
    untitled: string;
    addTag: string;
    startWriting: string;
    writeSubnote: string;
    subnote: string;
    saving: string;
    deleteNote: string;
    cancel: string;
    addEntry: string;
    adding: string;
    newEntry: string;
    delete: string;
    loading: string;
    back: string;
    saveNoteFirst: string;
  };
  library: {
    search: string;
    empty: string;
    noMatch: string;
    newItem: string;
    selectOrCreate: string;
    all: string;
    book: string;
    album: string;
    movie: string;
    game: string;
    video: string;
    misc: string;
    backlog: string;
    inProgress: string;
    finished: string;
    dropped: string;
    title: string;
    creator: string;
    url: string;
    rating: string;
    reactions: string;
    genres: string;
    status: string;
    type: string;
    thoughts: string;
    addThought: string;
    writeThought: string;
    save: string;
    delete: string;
    cancel: string;
    back: string;
    loading: string;
    saving: string;
    adding: string;
    platform: string;
    pages: string;
    duration: string;
    channel: string;
    deleteItem: string;
    filters: string;
    clearFilters: string;
    allStatuses: string;
    allGenres: string;
    allReactions: string;
    allPlatforms: string;
    ratingAndAbove: (n: number) => string;
    anyRating: string;
    noItemsForFilters: string;
    addCover: string;
    changeCover: string;
    removeCover: string;
    quickAdd: string;
    titlePlaceholder: string;
    albumName: string;
    artistName: string;
    artistPlaceholder: string;
    select: string;
    selectAll: string;
    updateStatus: string;
    nSelected: (n: number) => string;
    year: string;
    selectType: string;
    addToLibrary: string;
    listening: string;
    listened: string;
    nItems: (type: string, count: number) => string;
  };
  settings: {
    settings: string;
    journalControls: string;
    description: string;
    dataExport: string;
    dataExportDesc: string;
    openExportTools: string;
    restoreBackup: string;
    restoreBackupDesc: string;
    restoring: string;
    restoreFailed: string;
    importedResult: (journal: number, food: number, images: number) => string;
    loading: string;
    language: string;
    languageDesc: string;
    defaultView: string;
    defaultViewDesc: string;
  };
  exportPage: {
    export: string;
    exportAndDownload: string;
    selectionPreset: string;
    thisWeek: string;
    thisMonth: string;
    customRange: string;
    thisYear: string;
    everything: string;
    format: string;
    plainText: string;
    entriesSelected: (count: number) => string;
    exportSelected: string;
    preparingExport: string;
    downloadBackupJson: string;
    downloading: string;
    treeSelection: string;
  };
};

export const en: Translations = {
  localeCode: "en-US",
  nav: {
    dashboard: "Dashboard",
    journal: "Journal",
    food: "Food",
    notes: "Notes",
    openJournal: "Open journal",
    openFood: "Open food",
    openNotes: "Open notes",
    newJournalEntry: "New journal entry",
    newFoodEntry: "New food entry",
    newNote: "New note",
    library: "Library",
    openLibrary: "Open library",
    newLibraryItem: "New library item",
    createNew: "Create new",
  },
  journal: {
    back: "Back",
    selectDate: "Select a date to view entries",
    startWriting: "Start writing...",
    image: "Image",
    saving: "Saving...",
    saved: "Saved",
    saveFailed: "Save failed",
    offline: "Offline",
    offlineChanges: "You are offline. Changes stay visible here but are not being saved.",
    offlineBrowse: "You are offline. Reconnect to load journal dates and entries.",
    reconnectToLoad: "Reconnect to load your journal.",
    failedToLoadEntry: "Failed to load entry",
    failedToLoadJournalEntry: "Failed to load journal entry",
    connectionRequired: "Connection required",
    connectionRequiredDesc:
      "Install keeps the app shell available offline, but loading and saving journal entries still requires a connection.",
    newThought: "New thought",
  },
  food: {
    quickFoodLog: "Quick Food Log",
    whatAreYouEating: "What are you eating?",
    photo: "Photo",
    oneFieldOneTap: "One field, one tap.",
    log: "Log",
    logging: "Logging...",
    recentUncategorized: "Recent uncategorized",
    saved: "Saved",
    noFoodLogsYet: "No food logs yet.",
    photoEntry: "Photo entry",
    open: "Open",
    browseAndOrganize: "Browse & Organize",
    backToQuickLog: "\u2190 Food",
    uncategorized: (count) => `Uncategorized (${count})`,
    uncategorizedEntries: "Uncategorized Entries",
    assignAllByDate: "Assign All by Date",
    assigning: "Assigning...",
    assign: "Assign",
    noUncategorizedEntries: "No uncategorized food entries.",
    selectDate: "Select date",
    mealSlot: "Meal slot",
    noSlot: "No slot",
    breakfast: "Breakfast",
    morning_snack: "Morning Snack",
    lunch: "Lunch",
    afternoon_snack: "Afternoon Snack",
    dinner: "Dinner",
    midnight_snack: "Midnight Snack",
    observation: "Observation",
    uncategorizedSection: "Uncategorized",
    empty: "(empty)",
    skipped: "Skipped",
    skip: "Skip",
    edit: "Edit",
    add: "Add",
    undo: "Undo",
    inbox: (count) => `Inbox (${count})`,
    dayView: "Day View",
    jumpToDate: "Jump to date",
    assignToSelectedDay: (entryLabel) => `Assign ${entryLabel} to selected day`,
    delete: "Delete",
    cancel: "Cancel",
    loading: "Loading...",
  },
  notes: {
    searchNotes: "Search notes...",
    allTags: "All tags",
    noNotesMatchSearch: "No notes match your search.",
    noNotesYet: "No notes yet.",
    newNote: "+ New Note",
    selectOrCreate: "Select a note or create a new one.",
    untitled: "Untitled",
    addTag: "+ add tag",
    startWriting: "Start writing\u2026",
    writeSubnote: "Write a subnote\u2026 (\u2318\u21b5 to save, Esc to cancel)",
    subnote: "Subnote...",
    saving: "saving\u2026",
    deleteNote: "Delete note",
    cancel: "Cancel",
    addEntry: "Add entry",
    adding: "Adding\u2026",
    newEntry: "new entry",
    delete: "Delete",
    loading: "Loading...",
    back: "Back",
    saveNoteFirst: "Save the note first to attach images",
  },
  library: {
    search: "Search library...",
    empty: "No items yet.",
    noMatch: "No items match your search.",
    newItem: "+ New Item",
    selectOrCreate: "Select an item or create a new one.",
    all: "All",
    book: "Book",
    album: "Album",
    movie: "Movie",
    game: "Game",
    video: "Video",
    misc: "Misc",
    backlog: "Backlog",
    inProgress: "In Progress",
    finished: "Finished",
    dropped: "Dropped",
    title: "Title",
    creator: "Creator",
    url: "URL",
    rating: "Rating",
    reactions: "Reactions",
    genres: "Genres",
    status: "Status",
    type: "Type",
    thoughts: "Thoughts",
    addThought: "Add thought",
    writeThought: "Write a thought… (⌘↵ to save, Esc to cancel)",
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    back: "Back",
    loading: "Loading...",
    saving: "saving…",
    adding: "Adding…",
    platform: "Platform",
    pages: "Pages",
    duration: "Duration",
    channel: "Channel",
    deleteItem: "Delete item",
    filters: "Filters",
    clearFilters: "Clear filters",
    allStatuses: "All statuses",
    allGenres: "All genres",
    allReactions: "All reactions",
    allPlatforms: "All platforms",
    ratingAndAbove: (n) => `${n}+ stars`,
    anyRating: "Any rating",
    noItemsForFilters: "No items match your filters.",
    addCover: "Add cover",
    changeCover: "Change",
    removeCover: "Remove cover",
    quickAdd: "Quick add",
    titlePlaceholder: "Title...",
    albumName: "Album Name",
    artistName: "Artist Name",
    artistPlaceholder: "Artist...",
    select: "Select",
    selectAll: "Select all",
    updateStatus: "Update status",
    nSelected: (n) => `${n} selected`,
    year: "Year",
    selectType: "What are you adding?",
    addToLibrary: "Add to Library",
    listening: "Listening",
    listened: "Listened",
    nItems: (type, count) => `${type} (${count})`,
  },
  settings: {
    settings: "Settings",
    journalControls: "Journal controls",
    description: "Export backups, restore from a backup file, and adjust how the app opens.",
    dataExport: "Data export",
    dataExportDesc: "Choose text export formats or download a full backup JSON file.",
    openExportTools: "Open export tools",
    restoreBackup: "Restore backup",
    restoreBackupDesc:
      "Restore from a backup JSON file (V2 or V3). Existing entry IDs are skipped.",
    restoring: "Restoring\u2026",
    restoreFailed: "Restore failed.",
    importedResult: (journal, food, images) =>
      `Imported ${journal} journal, ${food} food, ${images} images.`,
    loading: "Loading\u2026",
    language: "Language",
    languageDesc: "Choose your preferred language.",
    defaultView: "Default view",
    defaultViewDesc: "Choose which page opens after login.",
  },
  exportPage: {
    export: "Export",
    exportAndDownload: "Export and download",
    selectionPreset: "Selection preset",
    thisWeek: "This week",
    thisMonth: "This month",
    customRange: "Custom range",
    thisYear: "This year",
    everything: "Everything",
    format: "Format",
    plainText: "Plain text",
    entriesSelected: (count) => `${count} entries selected`,
    exportSelected: "Export selected",
    preparingExport: "Preparing export\u2026",
    downloadBackupJson: "Download backup JSON",
    downloading: "Downloading\u2026",
    treeSelection: "Tree selection",
  },
};

export const ptBr: Translations = {
  localeCode: "pt-BR",
  nav: {
    dashboard: "Painel",
    journal: "Di\u00e1rio",
    food: "Alimenta\u00e7\u00e3o",
    notes: "Notas",
    openJournal: "Abrir di\u00e1rio",
    openFood: "Abrir alimenta\u00e7\u00e3o",
    openNotes: "Abrir notas",
    newJournalEntry: "Nova entrada no di\u00e1rio",
    newFoodEntry: "Nova entrada de alimenta\u00e7\u00e3o",
    newNote: "Nova nota",
    library: "Biblioteca",
    openLibrary: "Abrir biblioteca",
    newLibraryItem: "Novo item na biblioteca",
    createNew: "Criar novo",
  },
  journal: {
    back: "Voltar",
    selectDate: "Selecione uma data para ver as entradas",
    startWriting: "Comece a escrever...",
    image: "Imagem",
    saving: "Salvando...",
    saved: "Salvo",
    saveFailed: "Falha ao salvar",
    offline: "Offline",
    offlineChanges:
      "Voc\u00ea est\u00e1 offline. As altera\u00e7\u00f5es ficam vis\u00edveis aqui, mas n\u00e3o est\u00e3o sendo salvas.",
    offlineBrowse:
      "Voc\u00ea est\u00e1 offline. Reconecte para carregar as datas e entradas do di\u00e1rio.",
    reconnectToLoad: "Reconecte para carregar seu di\u00e1rio.",
    failedToLoadEntry: "Falha ao carregar entrada",
    failedToLoadJournalEntry: "Falha ao carregar entrada do di\u00e1rio",
    connectionRequired: "Conex\u00e3o necess\u00e1ria",
    connectionRequiredDesc:
      "O app permanece dispon\u00edvel offline, mas carregar e salvar entradas do di\u00e1rio ainda requer conex\u00e3o.",
    newThought: "Novo pensamento",
  },
  food: {
    quickFoodLog: "Registro R\u00e1pido de Alimenta\u00e7\u00e3o",
    whatAreYouEating: "O que voc\u00ea est\u00e1 comendo?",
    photo: "Foto",
    oneFieldOneTap: "Um campo, um toque.",
    log: "Registrar",
    logging: "Registrando...",
    recentUncategorized: "Recente n\u00e3o categorizado",
    saved: "Salvo",
    noFoodLogsYet: "Nenhum registro de alimenta\u00e7\u00e3o ainda.",
    photoEntry: "Entrada com foto",
    open: "Abrir",
    browseAndOrganize: "Navegar e Organizar",
    backToQuickLog: "\u2190 Alimenta\u00e7\u00e3o",
    uncategorized: (count) => `N\u00e3o categorizado (${count})`,
    uncategorizedEntries: "Entradas N\u00e3o Categorizadas",
    assignAllByDate: "Atribuir Tudo por Data",
    assigning: "Atribuindo...",
    assign: "Atribuir",
    noUncategorizedEntries: "Nenhuma entrada de alimenta\u00e7\u00e3o n\u00e3o categorizada.",
    selectDate: "Selecionar data",
    mealSlot: "Refei\u00e7\u00e3o",
    noSlot: "Sem refei\u00e7\u00e3o",
    breakfast: "Caf\u00e9 da manh\u00e3",
    morning_snack: "Lanche da manh\u00e3",
    lunch: "Almo\u00e7o",
    afternoon_snack: "Lanche da tarde",
    dinner: "Jantar",
    midnight_snack: "Lanche da madrugada",
    observation: "Observa\u00e7\u00e3o",
    uncategorizedSection: "N\u00e3o categorizado",
    empty: "(vazio)",
    skipped: "Pulado",
    skip: "Pular",
    edit: "Editar",
    add: "Adicionar",
    undo: "Desfazer",
    inbox: (count) => `Caixa de entrada (${count})`,
    dayView: "Ver dia",
    jumpToDate: "Ir para data",
    assignToSelectedDay: (entryLabel) => `Atribuir ${entryLabel} ao dia selecionado`,
    delete: "Excluir",
    cancel: "Cancelar",
    loading: "Carregando...",
  },
  notes: {
    searchNotes: "Buscar notas...",
    allTags: "Todas as tags",
    noNotesMatchSearch: "Nenhuma nota corresponde \u00e0 sua busca.",
    noNotesYet: "Nenhuma nota ainda.",
    newNote: "+ Nova nota",
    selectOrCreate: "Selecione uma nota ou crie uma nova.",
    untitled: "Sem t\u00edtulo",
    addTag: "+ adicionar tag",
    startWriting: "Comece a escrever\u2026",
    writeSubnote: "Escreva uma subnota\u2026 (\u2318\u21b5 para salvar, Esc para cancelar)",
    subnote: "Subnota...",
    saving: "salvando\u2026",
    deleteNote: "Excluir nota",
    cancel: "Cancelar",
    addEntry: "Adicionar entrada",
    adding: "Adicionando\u2026",
    newEntry: "nova entrada",
    delete: "Excluir",
    loading: "Carregando...",
    back: "Voltar",
    saveNoteFirst: "Salve a nota primeiro para anexar imagens",
  },
  library: {
    search: "Buscar na biblioteca...",
    empty: "Nenhum item ainda.",
    noMatch: "Nenhum item corresponde \u00e0 sua busca.",
    newItem: "+ Novo Item",
    selectOrCreate: "Selecione um item ou crie um novo.",
    all: "Todos",
    book: "Livro",
    album: "\u00c1lbum",
    movie: "Filme",
    game: "Jogo",
    video: "V\u00eddeo",
    misc: "Outros",
    backlog: "Lista",
    inProgress: "Em Progresso",
    finished: "Finalizado",
    dropped: "Abandonado",
    title: "T\u00edtulo",
    creator: "Criador",
    url: "URL",
    rating: "Avalia\u00e7\u00e3o",
    reactions: "Rea\u00e7\u00f5es",
    genres: "G\u00eaneros",
    status: "Status",
    type: "Tipo",
    thoughts: "Pensamentos",
    addThought: "Adicionar pensamento",
    writeThought: "Escreva um pensamento\u2026 (\u2318\u21b5 para salvar, Esc para cancelar)",
    save: "Salvar",
    delete: "Excluir",
    cancel: "Cancelar",
    back: "Voltar",
    loading: "Carregando...",
    saving: "salvando\u2026",
    adding: "Adicionando\u2026",
    platform: "Plataforma",
    pages: "P\u00e1ginas",
    duration: "Dura\u00e7\u00e3o",
    channel: "Canal",
    deleteItem: "Excluir item",
    filters: "Filtros",
    clearFilters: "Limpar filtros",
    allStatuses: "Todos os status",
    allGenres: "Todos os g\u00eaneros",
    allReactions: "Todas as rea\u00e7\u00f5es",
    allPlatforms: "Todas as plataformas",
    ratingAndAbove: (n) => `${n}+ estrelas`,
    anyRating: "Qualquer avalia\u00e7\u00e3o",
    noItemsForFilters: "Nenhum item corresponde aos seus filtros.",
    addCover: "Adicionar capa",
    changeCover: "Alterar",
    removeCover: "Remover capa",
    quickAdd: "Adicionar rápido",
    titlePlaceholder: "Título...",
    albumName: "Nome do Álbum",
    artistName: "Nome do Artista",
    artistPlaceholder: "Artista...",
    select: "Selecionar",
    selectAll: "Selecionar todos",
    updateStatus: "Atualizar status",
    nSelected: (n) => `${n} selecionados`,
    year: "Ano",
    selectType: "O que você está adicionando?",
    addToLibrary: "Adicionar à Biblioteca",
    listening: "Ouvindo",
    listened: "Ouvido",
    nItems: (type, count) => `${type} (${count})`,
  },
  settings: {
    settings: "Configura\u00e7\u00f5es",
    journalControls: "Controles do di\u00e1rio",
    description:
      "Exporte backups, restaure de um arquivo de backup e ajuste como o app abre.",
    dataExport: "Exportar dados",
    dataExportDesc:
      "Escolha formatos de exporta\u00e7\u00e3o ou baixe um arquivo JSON de backup completo.",
    openExportTools: "Abrir ferramentas de exporta\u00e7\u00e3o",
    restoreBackup: "Restaurar backup",
    restoreBackupDesc:
      "Restaurar de um arquivo JSON de backup (V2 ou V3). IDs de entradas existentes são ignorados.",
    restoring: "Restaurando\u2026",
    restoreFailed: "Falha na restaura\u00e7\u00e3o.",
    importedResult: (journal, food, images) =>
      `Importados ${journal} entradas do di\u00e1rio, ${food} de alimenta\u00e7\u00e3o, ${images} imagens.`,
    loading: "Carregando\u2026",
    language: "Idioma",
    languageDesc: "Escolha seu idioma preferido.",
    defaultView: "Vis\u00e3o padr\u00e3o",
    defaultViewDesc: "Escolha qual p\u00e1gina abre ap\u00f3s o login.",
  },
  exportPage: {
    export: "Exportar",
    exportAndDownload: "Exportar e baixar",
    selectionPreset: "Predefini\u00e7\u00e3o de sele\u00e7\u00e3o",
    thisWeek: "Esta semana",
    thisMonth: "Este m\u00eas",
    customRange: "Intervalo personalizado",
    thisYear: "Este ano",
    everything: "Tudo",
    format: "Formato",
    plainText: "Texto simples",
    entriesSelected: (count) => `${count} entradas selecionadas`,
    exportSelected: "Exportar selecionados",
    preparingExport: "Preparando exporta\u00e7\u00e3o\u2026",
    downloadBackupJson: "Baixar JSON de backup",
    downloading: "Baixando\u2026",
    treeSelection: "Sele\u00e7\u00e3o em \u00e1rvore",
  },
};

export const locales: Record<string, Translations> = { en, "pt-br": ptBr };

export function formatRelativeDate(iso: string, localeCode: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(localeCode, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
