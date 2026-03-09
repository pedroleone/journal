export type Translations = {
  localeCode: string; // BCP 47 tag for date/number formatting
  nav: {
    journal: string;
    food: string;
    notes: string;
    new: string;
    journalEntry: string;
    foodEntry: string;
    note: string;
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
    telegramCannotEdit: string;
    failedToLoadEntry: string;
    failedToLoadJournalEntry: string;
    connectionRequired: string;
    connectionRequiredDesc: string;
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
    lunch: string;
    dinner: string;
    snack: string;
    uncategorizedSection: string;
    empty: string;
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
    telegram: string;
    telegramDesc: string;
    connected: string;
    disconnect: string;
    waitingForConfirmation: string;
    generateNewCode: string;
    connectTelegram: string;
    telegramCommands: string;
    telegramCmd1: string;
    telegramCmd2: string;
    telegramCmd3: string;
    telegramCmd4: string;
    loading: string;
    language: string;
    languageDesc: string;
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
    journal: "Journal",
    food: "Food",
    notes: "Notes",
    new: "New",
    journalEntry: "Journal entry",
    foodEntry: "Food entry",
    note: "Note",
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
    telegramCannotEdit: "Telegram entries cannot be edited from write mode.",
    failedToLoadEntry: "Failed to load entry",
    failedToLoadJournalEntry: "Failed to load journal entry",
    connectionRequired: "Connection required",
    connectionRequiredDesc:
      "Install keeps the app shell available offline, but loading and saving journal entries still requires a connection.",
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
    backToQuickLog: "← Quick Log",
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
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
    uncategorizedSection: "Uncategorized",
    empty: "(empty)",
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
    startWriting: "Start writing…",
    writeSubnote: "Write a subnote… (⌘↵ to save, Esc to cancel)",
    subnote: "Subnote...",
    saving: "saving…",
    deleteNote: "Delete note",
    cancel: "Cancel",
    addEntry: "Add entry",
    adding: "Adding…",
    newEntry: "new entry",
    delete: "Delete",
    loading: "Loading...",
    back: "Back",
    saveNoteFirst: "Save the note first to attach images",
  },
  settings: {
    settings: "Settings",
    journalControls: "Journal controls",
    description:
      "Export backups, restore from a backup file, and keep Telegram commands close at hand.",
    dataExport: "Data export",
    dataExportDesc: "Choose text export formats or download a full backup JSON file.",
    openExportTools: "Open export tools",
    restoreBackup: "Restore backup",
    restoreBackupDesc:
      "Restore from a version 2 backup JSON file. Existing entry IDs are skipped.",
    restoring: "Restoring…",
    restoreFailed: "Restore failed.",
    importedResult: (journal, food, images) =>
      `Imported ${journal} journal, ${food} food, ${images} images.`,
    telegram: "Telegram",
    telegramDesc: "Connect your Telegram account to log food entries from the bot.",
    connected: "Connected",
    disconnect: "Disconnect",
    waitingForConfirmation: "Waiting for confirmation…",
    generateNewCode: "Generate new code",
    connectTelegram: "Connect Telegram",
    telegramCommands: "Telegram commands",
    telegramCmd1: "/food saves a food entry.",
    telegramCmd2: "Messages without a command also save as food entries.",
    telegramCmd3: "/journal, /idea, and /note are intentionally unsupported.",
    telegramCmd4: "Photos can be sent with or without /food and land in uncategorized food.",
    loading: "Loading…",
    language: "Language",
    languageDesc: "Choose your preferred language.",
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
    preparingExport: "Preparing export…",
    downloadBackupJson: "Download backup JSON",
    downloading: "Downloading…",
    treeSelection: "Tree selection",
  },
};

export const ptBr: Translations = {
  localeCode: "pt-BR",
  nav: {
    journal: "Diário",
    food: "Alimentação",
    notes: "Notas",
    new: "Novo",
    journalEntry: "Entrada no diário",
    foodEntry: "Entrada de alimentação",
    note: "Nota",
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
      "Você está offline. As alterações ficam visíveis aqui, mas não estão sendo salvas.",
    offlineBrowse:
      "Você está offline. Reconecte para carregar as datas e entradas do diário.",
    reconnectToLoad: "Reconecte para carregar seu diário.",
    telegramCannotEdit:
      "Entradas do Telegram não podem ser editadas no modo de escrita.",
    failedToLoadEntry: "Falha ao carregar entrada",
    failedToLoadJournalEntry: "Falha ao carregar entrada do diário",
    connectionRequired: "Conexão necessária",
    connectionRequiredDesc:
      "O app permanece disponível offline, mas carregar e salvar entradas do diário ainda requer conexão.",
  },
  food: {
    quickFoodLog: "Registro Rápido de Alimentação",
    whatAreYouEating: "O que você está comendo?",
    photo: "Foto",
    oneFieldOneTap: "Um campo, um toque.",
    log: "Registrar",
    logging: "Registrando...",
    recentUncategorized: "Recente não categorizado",
    saved: "Salvo",
    noFoodLogsYet: "Nenhum registro de alimentação ainda.",
    photoEntry: "Entrada com foto",
    open: "Abrir",
    browseAndOrganize: "Navegar e Organizar",
    backToQuickLog: "← Registro Rápido",
    uncategorized: (count) => `Não categorizado (${count})`,
    uncategorizedEntries: "Entradas Não Categorizadas",
    assignAllByDate: "Atribuir Tudo por Data",
    assigning: "Atribuindo...",
    assign: "Atribuir",
    noUncategorizedEntries: "Nenhuma entrada de alimentação não categorizada.",
    selectDate: "Selecionar data",
    mealSlot: "Refeição",
    noSlot: "Sem refeição",
    breakfast: "Café da manhã",
    lunch: "Almoço",
    dinner: "Jantar",
    snack: "Lanche",
    uncategorizedSection: "Não categorizado",
    empty: "(vazio)",
  },
  notes: {
    searchNotes: "Buscar notas...",
    allTags: "Todas as tags",
    noNotesMatchSearch: "Nenhuma nota corresponde à sua busca.",
    noNotesYet: "Nenhuma nota ainda.",
    newNote: "+ Nova nota",
    selectOrCreate: "Selecione uma nota ou crie uma nova.",
    untitled: "Sem título",
    addTag: "+ adicionar tag",
    startWriting: "Comece a escrever…",
    writeSubnote: "Escreva uma subnota… (⌘↵ para salvar, Esc para cancelar)",
    subnote: "Subnota...",
    saving: "salvando…",
    deleteNote: "Excluir nota",
    cancel: "Cancelar",
    addEntry: "Adicionar entrada",
    adding: "Adicionando…",
    newEntry: "nova entrada",
    delete: "Excluir",
    loading: "Carregando...",
    back: "Voltar",
    saveNoteFirst: "Salve a nota primeiro para anexar imagens",
  },
  settings: {
    settings: "Configurações",
    journalControls: "Controles do diário",
    description:
      "Exporte backups, restaure de um arquivo de backup e mantenha os comandos do Telegram à mão.",
    dataExport: "Exportar dados",
    dataExportDesc:
      "Escolha formatos de exportação ou baixe um arquivo JSON de backup completo.",
    openExportTools: "Abrir ferramentas de exportação",
    restoreBackup: "Restaurar backup",
    restoreBackupDesc:
      "Restaurar de um arquivo JSON de backup versão 2. IDs de entradas existentes são ignorados.",
    restoring: "Restaurando…",
    restoreFailed: "Falha na restauração.",
    importedResult: (journal, food, images) =>
      `Importados ${journal} entradas do diário, ${food} de alimentação, ${images} imagens.`,
    telegram: "Telegram",
    telegramDesc:
      "Conecte sua conta do Telegram para registrar entradas de alimentação pelo bot.",
    connected: "Conectado",
    disconnect: "Desconectar",
    waitingForConfirmation: "Aguardando confirmação…",
    generateNewCode: "Gerar novo código",
    connectTelegram: "Conectar Telegram",
    telegramCommands: "Comandos do Telegram",
    telegramCmd1: "/food salva uma entrada de alimentação.",
    telegramCmd2:
      "Mensagens sem um comando também são salvas como entradas de alimentação.",
    telegramCmd3:
      "/journal, /idea e /note não são suportados intencionalmente.",
    telegramCmd4:
      "Fotos podem ser enviadas com ou sem /food e ficam em alimentação não categorizada.",
    loading: "Carregando…",
    language: "Idioma",
    languageDesc: "Escolha seu idioma preferido.",
  },
  exportPage: {
    export: "Exportar",
    exportAndDownload: "Exportar e baixar",
    selectionPreset: "Predefinição de seleção",
    thisWeek: "Esta semana",
    thisMonth: "Este mês",
    customRange: "Intervalo personalizado",
    thisYear: "Este ano",
    everything: "Tudo",
    format: "Formato",
    plainText: "Texto simples",
    entriesSelected: (count) => `${count} entradas selecionadas`,
    exportSelected: "Exportar selecionados",
    preparingExport: "Preparando exportação…",
    downloadBackupJson: "Baixar JSON de backup",
    downloading: "Baixando…",
    treeSelection: "Seleção em árvore",
  },
};

export const locales: Record<string, Translations> = { en, "pt-br": ptBr };
