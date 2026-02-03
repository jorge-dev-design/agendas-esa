const STORAGE_KEYS = {
  config: "agenda-config-v2",
};

const DAYS = [
  { key: "segunda", label: "Segunda-Feira", short: "Segunda" },
  { key: "terca", label: "Terça-Feira", short: "Terça" },
  { key: "quarta", label: "Quarta-Feira", short: "Quarta" },
  { key: "quinta", label: "Quinta-Feira", short: "Quinta" },
  { key: "sexta", label: "Sexta-Feira", short: "Sexta" },
  { key: "sabado", label: "Sábado", short: "Sábado" },
];

const DAY_CLASS_MAP = DAYS.reduce((acc, day) => {
  acc[day.label] = `day-${day.key}`;
  return acc;
}, {});

const DAY_ORDER = DAYS.reduce((acc, day, index) => {
  acc[day.label] = index;
  return acc;
}, {});

let agendaConfig = loadConfig();

function createBaseConfig() {
  return {
    meta: {
      teacherSeq: 0,
      subjectSeq: 0,
      groupSeq: 0,
      fieldSeq: 0,
    },
    teachers: [],
  };
}

function loadConfig() {
  const raw = localStorage.getItem(STORAGE_KEYS.config);
  if (!raw) return createBaseConfig();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.meta) parsed.meta = {};
    parsed.meta.teacherSeq = parsed.meta.teacherSeq || 0;
    parsed.meta.subjectSeq = parsed.meta.subjectSeq || 0;
    parsed.meta.groupSeq = parsed.meta.groupSeq || 0;
    parsed.meta.fieldSeq = parsed.meta.fieldSeq || 0;
    parsed.teachers = parsed.teachers || [];
    return parsed;
  } catch (err) {
    console.error("Erro ao ler configuracao:", err);
    return createBaseConfig();
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(agendaConfig));
}

function nextId(seqKey, prefix) {
  agendaConfig.meta[seqKey] += 1;
  return `${prefix}${agendaConfig.meta[seqKey]}`;
}

function nextFieldId() {
  agendaConfig.meta.fieldSeq += 1;
  return `campo${String(agendaConfig.meta.fieldSeq).padStart(3, "0")}`;
}

function createTeacher(name) {
  const id = nextId("teacherSeq", "t");
  return {
    id,
    name,
    checkboxId: `check-${id}`,
    subjects: [],
  };
}

function createSubject(name) {
  const id = nextId("subjectSeq", "s");
  return {
    id,
    name,
    groups: [],
  };
}

function createGroup(label) {
  const id = nextId("groupSeq", "g");
  return {
    id,
    label,
    days: [],
  };
}

function createDay(dayLabel) {
  return {
    label: dayLabel,
    fields: {
      contentId: nextFieldId(),
      homeworkId: nextFieldId(),
    },
  };
}

function getTeacherById(teacherId) {
  return agendaConfig.teachers.find((teacher) => teacher.id === teacherId);
}

function getSubjectById(teacher, subjectId) {
  return teacher.subjects.find((subject) => subject.id === subjectId);
}

function getGroupById(subject, groupId) {
  return subject.groups.find((group) => group.id === groupId);
}

function ensureDay(group, dayLabel) {
  const existing = group.days.find((day) => day.label === dayLabel);
  if (existing) return;
  group.days.push(createDay(dayLabel));
}

function removeDay(group, dayLabel) {
  group.days = group.days.filter((day) => day.label !== dayLabel);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function renderAgenda() {
  const grid = document.getElementById("card-grid");
  if (!grid) return;
  grid.innerHTML = "";

  agendaConfig.teachers.forEach((teacher) => {
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "cabecalho";

    const title = document.createElement("h2");
    title.textContent = teacher.name || "Professor";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "card-checkbox";
    checkbox.id = teacher.checkboxId;
    checkbox.checked = localStorage.getItem(teacher.checkboxId) === "true";

    header.appendChild(title);
    header.appendChild(checkbox);
    card.appendChild(header);

    teacher.subjects.forEach((subject) => {
      const subjectTitle = document.createElement("h3");
      subjectTitle.textContent = subject.name || "Matéria";
      card.appendChild(subjectTitle);

      subject.groups.forEach((group) => {
        const groupBlock = document.createElement("div");
        groupBlock.className = "ano-bloco";

        const groupTitle = document.createElement("h4");
        groupTitle.textContent = group.label || "Turma";
        groupBlock.appendChild(groupTitle);

        const sortedDays = [...group.days].sort((a, b) => {
          return (DAY_ORDER[a.label] ?? 99) - (DAY_ORDER[b.label] ?? 99);
        });

        sortedDays.forEach((day) => {
          const dayBlock = document.createElement("div");
          dayBlock.className = `dia ${DAY_CLASS_MAP[day.label] || ""}`.trim();
          dayBlock.dataset.day = day.label;

          const dayTitle = document.createElement("h5");
          dayTitle.textContent = day.label;
          dayBlock.appendChild(dayTitle);

          const box = document.createElement("div");
          box.className = "box";

          const contentLabel = document.createElement("div");
          contentLabel.className = "titulo";
          contentLabel.textContent = "Conteúdo";

          const contentInput = document.createElement("input");
          contentInput.id = day.fields.contentId;
          contentInput.className = "card-textarea";
          contentInput.type = "text";
          contentInput.placeholder = "Digite o conteúdo";
          contentInput.value = localStorage.getItem(day.fields.contentId) || "";

          const homeworkLabel = document.createElement("div");
          homeworkLabel.className = "titulo";
          homeworkLabel.textContent = "Atividade para casa";

          const homeworkInput = document.createElement("input");
          homeworkInput.id = day.fields.homeworkId;
          homeworkInput.className = "card-textarea";
          homeworkInput.type = "text";
          homeworkInput.placeholder = "Digite a atividade";
          homeworkInput.value = localStorage.getItem(day.fields.homeworkId) || "";

          box.appendChild(contentLabel);
          box.appendChild(contentInput);
          box.appendChild(homeworkLabel);
          box.appendChild(homeworkInput);
          dayBlock.appendChild(box);
          groupBlock.appendChild(dayBlock);
        });

        card.appendChild(groupBlock);
      });
    });

    grid.appendChild(card);
  });

  requestMasonryRefresh();
}

function renderManager() {
  const list = document.getElementById("manager-list");
  if (!list) return;
  list.innerHTML = "";

  if (agendaConfig.teachers.length === 0) {
    const empty = document.createElement("div");
    empty.className = "manager-empty";
    empty.textContent = "Nenhum professor cadastrado ainda.";
    list.appendChild(empty);
    return;
  }

  agendaConfig.teachers.forEach((teacher) => {
    const teacherCard = document.createElement("div");
    teacherCard.className = "manager-card";

    const teacherHeader = document.createElement("div");
    teacherHeader.className = "manager-card-header";

    const teacherInput = document.createElement("input");
    teacherInput.type = "text";
    teacherInput.value = teacher.name;
    teacherInput.placeholder = "Nome do professor";
    teacherInput.dataset.action = "update-teacher";
    teacherInput.dataset.teacherId = teacher.id;

    const teacherRemove = document.createElement("button");
    teacherRemove.className = "btn btn-ghost";
    teacherRemove.dataset.action = "remove-teacher";
    teacherRemove.dataset.teacherId = teacher.id;
    teacherRemove.innerHTML = '<i class="fa-solid fa-trash"></i> Remover';

    teacherHeader.appendChild(teacherInput);
    teacherHeader.appendChild(teacherRemove);
    teacherCard.appendChild(teacherHeader);

    const subjectList = document.createElement("div");
    subjectList.className = "manager-subjects";

    teacher.subjects.forEach((subject) => {
      const subjectCard = document.createElement("div");
      subjectCard.className = "manager-subject";

      const subjectHeader = document.createElement("div");
      subjectHeader.className = "manager-subject-header";

      const subjectInput = document.createElement("input");
      subjectInput.type = "text";
      subjectInput.value = subject.name;
      subjectInput.placeholder = "Matéria";
      subjectInput.dataset.action = "update-subject";
      subjectInput.dataset.teacherId = teacher.id;
      subjectInput.dataset.subjectId = subject.id;

      const subjectRemove = document.createElement("button");
      subjectRemove.className = "btn btn-ghost";
      subjectRemove.dataset.action = "remove-subject";
      subjectRemove.dataset.teacherId = teacher.id;
      subjectRemove.dataset.subjectId = subject.id;
      subjectRemove.innerHTML = '<i class="fa-solid fa-trash"></i>';

      subjectHeader.appendChild(subjectInput);
      subjectHeader.appendChild(subjectRemove);
      subjectCard.appendChild(subjectHeader);

      const groupsWrap = document.createElement("div");
      groupsWrap.className = "manager-groups";

      subject.groups.forEach((group) => {
        const groupCard = document.createElement("div");
        groupCard.className = "manager-group";

        const groupHeader = document.createElement("div");
        groupHeader.className = "manager-group-header";

        const groupInput = document.createElement("input");
        groupInput.type = "text";
        groupInput.value = group.label;
        groupInput.placeholder = "Turma (ex: 7o ano TARDE)";
        groupInput.dataset.action = "update-group";
        groupInput.dataset.teacherId = teacher.id;
        groupInput.dataset.subjectId = subject.id;
        groupInput.dataset.groupId = group.id;

        const groupRemove = document.createElement("button");
        groupRemove.className = "btn btn-ghost";
        groupRemove.dataset.action = "remove-group";
        groupRemove.dataset.teacherId = teacher.id;
        groupRemove.dataset.subjectId = subject.id;
        groupRemove.dataset.groupId = group.id;
        groupRemove.innerHTML = '<i class="fa-solid fa-trash"></i>';

        groupHeader.appendChild(groupInput);
        groupHeader.appendChild(groupRemove);
        groupCard.appendChild(groupHeader);

        const dayPicker = document.createElement("div");
        dayPicker.className = "day-picker";
        DAYS.forEach((day) => {
          const dayItem = document.createElement("label");
          dayItem.className = "day-option";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = group.days.some((item) => item.label === day.label);
          checkbox.dataset.action = "toggle-day";
          checkbox.dataset.teacherId = teacher.id;
          checkbox.dataset.subjectId = subject.id;
          checkbox.dataset.groupId = group.id;
          checkbox.dataset.dayLabel = day.label;

          const span = document.createElement("span");
          span.textContent = day.short;

          dayItem.appendChild(checkbox);
          dayItem.appendChild(span);
          dayPicker.appendChild(dayItem);
        });

        groupCard.appendChild(dayPicker);
        groupsWrap.appendChild(groupCard);
      });

      subjectCard.appendChild(groupsWrap);

      const addGroup = document.createElement("div");
      addGroup.className = "manager-add";

      const groupLabel = document.createElement("input");
      groupLabel.type = "text";
      groupLabel.placeholder = "Nova turma";
      groupLabel.dataset.newGroupLabel = subject.id;

      const addGroupPicker = document.createElement("div");
      addGroupPicker.className = "day-picker";
      DAYS.forEach((day) => {
        const dayItem = document.createElement("label");
        dayItem.className = "day-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.newGroupDay = day.label;
        checkbox.dataset.subjectId = subject.id;

        const span = document.createElement("span");
        span.textContent = day.short;

        dayItem.appendChild(checkbox);
        dayItem.appendChild(span);
        addGroupPicker.appendChild(dayItem);
      });

      const addGroupButton = document.createElement("button");
      addGroupButton.className = "btn btn-ghost";
      addGroupButton.dataset.action = "add-group";
      addGroupButton.dataset.teacherId = teacher.id;
      addGroupButton.dataset.subjectId = subject.id;
      addGroupButton.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Adicionar turma';

      addGroup.appendChild(groupLabel);
      addGroup.appendChild(addGroupPicker);
      addGroup.appendChild(addGroupButton);
      subjectCard.appendChild(addGroup);

      subjectList.appendChild(subjectCard);
    });

    teacherCard.appendChild(subjectList);

    const addSubject = document.createElement("div");
    addSubject.className = "manager-add";

    const subjectInput = document.createElement("input");
    subjectInput.type = "text";
      subjectInput.placeholder = "Nova matéria";
    subjectInput.dataset.newSubjectFor = teacher.id;

    const addSubjectButton = document.createElement("button");
    addSubjectButton.className = "btn btn-ghost";
    addSubjectButton.dataset.action = "add-subject";
    addSubjectButton.dataset.teacherId = teacher.id;
      addSubjectButton.innerHTML = '<i class="fa-solid fa-circle-plus"></i> Adicionar matéria';

    addSubject.appendChild(subjectInput);
    addSubject.appendChild(addSubjectButton);
    teacherCard.appendChild(addSubject);

    list.appendChild(teacherCard);
  });
}

function renderReport() {
  const report = document.getElementById("field-report");
  if (!report) return;

  const lines = [];
  lines.push("RELATÓRIO DE CAMPOS DA AGENDA");
  lines.push("--------------------------------");
  lines.push("Use os códigos entre {{ }} no Word.");
  lines.push("");
  lines.push("Datas:");
  lines.push("- campoData1  | Data inicial | {{campoData1}}");
  lines.push("- campoData2  | Data final   | {{campoData2}}");
  lines.push("");

  agendaConfig.teachers.forEach((teacher) => {
    const teacherName = teacher.name || "Professor";
    teacher.subjects.forEach((subject) => {
      const subjectName = subject.name || "Matéria";
      subject.groups.forEach((group) => {
        const groupLabel = group.label || "Turma";
        group.days.forEach((day) => {
          lines.push(
            `${day.fields.contentId} | ${teacherName} > ${subjectName} > ${groupLabel} > ${day.label} > Conteúdo | {{${day.fields.contentId}}}`
          );
          lines.push(
            `${day.fields.homeworkId} | ${teacherName} > ${subjectName} > ${groupLabel} > ${day.label} > Atividade | {{${day.fields.homeworkId}}}`
          );
        });
      });
    });
  });

  report.value = lines.join("\n");
}

function renderMissingTeachers() {
  const list = document.getElementById("missing-list");
  if (!list) return;
  list.innerHTML = "";

  const missing = agendaConfig.teachers.filter((teacher) => {
    const stored = localStorage.getItem(teacher.checkboxId);
    return stored !== "true";
  });

  if (missing.length === 0) {
    const empty = document.createElement("div");
    empty.className = "missing-empty";
    empty.textContent = "Nenhum professor em falta.";
    list.appendChild(empty);
    return;
  }

  missing.forEach((teacher) => {
    const item = document.createElement("div");
    item.className = "missing-item";

    const name = document.createElement("span");
    name.textContent = teacher.name || "Professor";

    const tag = document.createElement("span");
    tag.className = "missing-tag";
    tag.textContent = "Falta";

    item.appendChild(name);
    item.appendChild(tag);
    list.appendChild(item);
  });
}

function toggleEmptyState() {
  const empty = document.getElementById("empty-state");
  if (!empty) return;
  empty.style.display = agendaConfig.teachers.length ? "none" : "block";
}

function requestMasonryRefresh() {
  if (typeof window.refreshMasonry === "function") {
    window.refreshMasonry();
  } else {
    setTimeout(() => {
      if (typeof window.refreshMasonry === "function") {
        window.refreshMasonry();
      }
    }, 300);
  }
}

function renderAll() {
  renderAgenda();
  renderManager();
  renderReport();
  renderMissingTeachers();
  toggleEmptyState();
}

function setupCardEvents() {
  const grid = document.getElementById("card-grid");
  if (!grid) return;

  grid.addEventListener("input", (event) => {
    const target = event.target;
    if (target && target.classList.contains("card-textarea")) {
      localStorage.setItem(target.id, target.value);
    }
  });

  grid.addEventListener("change", (event) => {
    const target = event.target;
    if (target && target.classList.contains("card-checkbox")) {
      localStorage.setItem(target.id, target.checked);
      renderMissingTeachers();
    }
  });
}

function setupManagerEvents() {
  const addTeacherButton = document.getElementById("add-teacher");
  const teacherInput = document.getElementById("new-teacher-name");
  const list = document.getElementById("manager-list");

  if (addTeacherButton && teacherInput) {
    addTeacherButton.addEventListener("click", () => {
      const name = teacherInput.value.trim();
      if (!name) {
        showToast("Informe o nome do professor.");
        return;
      }
      agendaConfig.teachers.push(createTeacher(name));
      teacherInput.value = "";
      saveConfig();
      renderAll();
    });
  }

  if (!list) return;

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    if (action === "remove-teacher") {
      const teacherId = button.dataset.teacherId;
      agendaConfig.teachers = agendaConfig.teachers.filter(
        (teacher) => teacher.id !== teacherId
      );
      saveConfig();
      renderAll();
      return;
    }

    if (action === "add-subject") {
      const teacherId = button.dataset.teacherId;
      const teacher = getTeacherById(teacherId);
      if (!teacher) return;
      const input = list.querySelector(`input[data-new-subject-for="${teacherId}"]`);
      const subjectName = input ? input.value.trim() : "";
      if (!subjectName) {
        showToast("Informe o nome da matéria.");
        return;
      }
      teacher.subjects.push(createSubject(subjectName));
      if (input) input.value = "";
      saveConfig();
      renderAll();
      return;
    }

    if (action === "remove-subject") {
      const teacherId = button.dataset.teacherId;
      const subjectId = button.dataset.subjectId;
      const teacher = getTeacherById(teacherId);
      if (!teacher) return;
      teacher.subjects = teacher.subjects.filter(
        (subject) => subject.id !== subjectId
      );
      saveConfig();
      renderAll();
      return;
    }

    if (action === "add-group") {
      const teacherId = button.dataset.teacherId;
      const subjectId = button.dataset.subjectId;
      const teacher = getTeacherById(teacherId);
      if (!teacher) return;
      const subject = getSubjectById(teacher, subjectId);
      if (!subject) return;

      const labelInput = list.querySelector(
        `input[data-new-group-label="${subjectId}"]`
      );
      const label = labelInput ? labelInput.value.trim() : "";
      if (!label) {
        showToast("Informe o nome da turma.");
        return;
      }

      const dayChecks = Array.from(
        list.querySelectorAll(`input[data-subject-id="${subjectId}"][data-new-group-day]`)
      );
      const selectedDays = dayChecks
        .filter((input) => input.checked)
        .map((input) => input.dataset.newGroupDay);

      if (selectedDays.length === 0) {
        showToast("Selecione pelo menos um dia.");
        return;
      }

      const group = createGroup(label);
      selectedDays.forEach((dayLabel) => ensureDay(group, dayLabel));
      subject.groups.push(group);

      if (labelInput) labelInput.value = "";
      dayChecks.forEach((input) => {
        input.checked = false;
      });

      saveConfig();
      renderAll();
      return;
    }

    if (action === "remove-group") {
      const teacherId = button.dataset.teacherId;
      const subjectId = button.dataset.subjectId;
      const groupId = button.dataset.groupId;
      const teacher = getTeacherById(teacherId);
      if (!teacher) return;
      const subject = getSubjectById(teacher, subjectId);
      if (!subject) return;
      subject.groups = subject.groups.filter((group) => group.id !== groupId);
      saveConfig();
      renderAll();
      return;
    }
  });

  list.addEventListener("change", (event) => {
    const target = event.target;
    if (!target) return;

    if (target.dataset.action === "update-teacher") {
      const teacher = getTeacherById(target.dataset.teacherId);
      if (teacher) {
        teacher.name = target.value.trim() || "Professor";
        saveConfig();
        renderAgenda();
        renderReport();
      }
      return;
    }

    if (target.dataset.action === "update-subject") {
      const teacher = getTeacherById(target.dataset.teacherId);
      if (!teacher) return;
      const subject = getSubjectById(teacher, target.dataset.subjectId);
      if (subject) {
        subject.name = target.value.trim() || "Matéria";
        saveConfig();
        renderAgenda();
        renderReport();
      }
      return;
    }

    if (target.dataset.action === "update-group") {
      const teacher = getTeacherById(target.dataset.teacherId);
      if (!teacher) return;
      const subject = getSubjectById(teacher, target.dataset.subjectId);
      if (!subject) return;
      const group = getGroupById(subject, target.dataset.groupId);
      if (group) {
        group.label = target.value.trim() || "Turma";
        saveConfig();
        renderAgenda();
        renderReport();
      }
      return;
    }

    if (target.dataset.action === "toggle-day") {
      const teacher = getTeacherById(target.dataset.teacherId);
      if (!teacher) return;
      const subject = getSubjectById(teacher, target.dataset.subjectId);
      if (!subject) return;
      const group = getGroupById(subject, target.dataset.groupId);
      if (!group) return;

      if (target.checked) {
        ensureDay(group, target.dataset.dayLabel);
      } else {
        removeDay(group, target.dataset.dayLabel);
      }
      saveConfig();
      renderAgenda();
      renderReport();
      return;
    }
  });
}

function setupDrawer() {
  const drawer = document.getElementById("agenda-drawer");
  const overlay = document.getElementById("drawer-overlay");
  const toggle = document.getElementById("menu-toggle");
  const close = document.getElementById("drawer-close");
  const openManageButton = document.getElementById("empty-open-manage");
  const openReportButton = document.getElementById("open-report");

  function openDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("no-scroll");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    drawer.setAttribute("aria-hidden", "true");
  }

  toggle?.addEventListener("click", openDrawer);
  close?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  if (openManageButton) {
    openManageButton.addEventListener("click", () => {
      openDrawer();
      setActiveTab("tab-manage");
    });
  }

  if (openReportButton) {
    openReportButton.addEventListener("click", () => {
      setActiveTab("tab-manage");
    });
  }

  const tabs = drawer?.querySelectorAll(".tab-btn") || [];
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.tab);
    });
  });

  const scrollButtons = drawer?.querySelectorAll("button[data-scroll]") || [];
  scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scroll;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      closeDrawer();
    });
  });

  function setActiveTab(tabId) {
    if (!drawer) return;
    const allTabs = drawer.querySelectorAll(".tab-btn");
    const panels = drawer.querySelectorAll(".tab-panel");

    allTabs.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === tabId);
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === tabId);
    });
  }
}

function setupSearch() {
  const searchButton = document.getElementById("search-btn");
  if (!searchButton) return;

  searchButton.addEventListener("click", () => {
    try {
      window.find("");
    } catch (err) {
      // ignore
    }

    try {
      const event = new KeyboardEvent("keydown", {
        key: "f",
        ctrlKey: true,
        metaKey: true,
      });
      document.dispatchEvent(event);
    } catch (err) {
      // ignore
    }

    showToast("Se a busca não abrir, use Ctrl+F (ou Cmd+F).");
  });
}

function setupDates() {
  const dateInputs = [
    document.getElementById("campo-data-1"),
    document.getElementById("campo-data-2"),
  ].filter(Boolean);

  dateInputs.forEach((input) => {
    const saved = localStorage.getItem(input.id);
    if (saved) input.value = saved;
    input.addEventListener("input", () => {
      localStorage.setItem(input.id, input.value);
    });
  });
}

function setupClearButton() {
  const clearButton = document.getElementById("limparCampos");
  if (!clearButton) return;

  clearButton.addEventListener("click", () => {
    document.querySelectorAll(".card-textarea").forEach((input) => {
      localStorage.removeItem(input.id);
      input.value = "";
    });
    document.querySelectorAll(".card-checkbox").forEach((checkbox) => {
      localStorage.removeItem(checkbox.id);
      checkbox.checked = false;
    });
    ["campo-data-1", "campo-data-2"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        localStorage.removeItem(id);
        input.value = "";
      }
    });
    showToast("Campos limpos.");
  });
}

function formatarDataBR(dataISO) {
  if (!dataISO) return "Não possui";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function coletarCamposParaDoc() {
  const data = {};
  document.querySelectorAll(".card-textarea").forEach((input) => {
    data[input.id] = input.value.trim() || "Não possui";
  });

  const data1 = document.getElementById("campo-data-1")?.value || "";
  const data2 = document.getElementById("campo-data-2")?.value || "";
  data.campoData1 = formatarDataBR(data1);
  data.campoData2 = formatarDataBR(data2);

  return data;
}


function parseSerieTurno(label) {
  // tenta achar 6/7/8/9 no começo da string
  const mSerie = String(label).match(/(^|\s)(6|7|8|9)\s*ano/i);
  const serie = mSerie ? mSerie[2] : null;

  const up = String(label).toUpperCase();
  const temManha = up.includes("MANHA") || up.includes("MANHÃ");
  const temTarde = up.includes("TARDE");
  const turnos = [];
  if (temManha) turnos.push("M");
  if (temTarde) turnos.push("T");

  return { serie, turnos };
}

function tituloTurma(serie, turno) {
  const turnoTxt = turno === "M" ? "MANHÃ" : "TARDE";
  return `${serie}º ANO ENS. FUND. II (${turnoTxt})`;
}

function buildDocsData(config, campos, campoData1, campoData2) {
  const docMap = {};

  const baseDias = () => ([
    { diaNome: "SEGUNDA-FEIRA", aulas: [] },
    { diaNome: "TERÇA-FEIRA", aulas: [] },
    { diaNome: "QUARTA-FEIRA", aulas: [] },
    { diaNome: "QUINTA-FEIRA", aulas: [] },
    { diaNome: "SEXTA-FEIRA", aulas: [] },
  ]);

  const idxDia = (label) => {
    const l = String(label || "").toLowerCase();
    if (l.includes("segunda")) return 0;
    if (l.includes("terça") || l.includes("terca")) return 1;
    if (l.includes("quarta")) return 2;
    if (l.includes("quinta")) return 3;
    if (l.includes("sexta")) return 4;
    return null;
  };

  const normalizeTurno = (label) => {
    const l = String(label || "").toLowerCase();
    const hasM = l.includes("manhã") || l.includes("manha");
    const hasT = l.includes("tarde");
    if (hasM && hasT) return "MT";
    if (hasM) return "M";
    if (hasT) return "T";
    return ""; // sem turno explícito
  };

  const keyFromLabel = (label, turnoOverride = "") => {
    // chave interna única e estável no docMap
    const raw = String(label || "").trim() || "Turma";
    const turno = turnoOverride || normalizeTurno(raw);
    const key = turno ? `${raw}__${turno}` : raw;
    return key;
  };

  const displayTitle = (label, turnoOverride = "") => {
    const raw = String(label || "").trim() || "Turma";
    const turno = turnoOverride || normalizeTurno(raw);
    if (turno === "M") {
      // Se a label já tem manhã, deixa; senão, anexa
      return /manh[ãa]/i.test(raw) ? raw : `${raw} (MANHÃ)`;
    }
    if (turno === "T") {
      return /tarde/i.test(raw) ? raw : `${raw} (TARDE)`;
    }
    if (turno === "MT") {
      // Para o caso MT, o título final será construído no chamador (M e T separados)
      return raw;
    }
    return raw;
  };

  const ensureDoc = (label, turnoOverride = "") => {
    const key = keyFromLabel(label, turnoOverride);
    if (!docMap[key]) {
      docMap[key] = {
        turmaTitulo: displayTitle(label, turnoOverride),
        campoData1,
        campoData2,
        dias: baseDias(),
      };
    }
    return key;
  };

  const addAulaByKey = (docKey, diaIndex, disciplina, contentId, homeworkId) => {
    const doc = docMap[docKey];
    if (!doc || diaIndex === null) return;

    const conteudo = (campos[contentId] ?? "").trim() || "Não possui";
    const casa = (campos[homeworkId] ?? "").trim() || "Não possui";

    doc.dias[diaIndex].aulas.push({
      disciplina: (disciplina || "").toUpperCase(),
      conteudo,
      casa,
    });
  };

  const allTeachers = Array.isArray(config?.teachers) ? config.teachers : [];
  allTeachers.forEach((teacher) => {
    (teacher.subjects || []).forEach((subject) => {
      const disciplina = subject.name || "";
      (subject.groups || []).forEach((group) => {
        const label = group.label || "Turma";

        // Se for "MANHA E TARDE", duplica nos dois arquivos
        const turno = normalizeTurno(label);
        const keys = [];
        if (turno === "MT") {
          keys.push(ensureDoc(label, "M"));
          keys.push(ensureDoc(label, "T"));
        } else if (turno === "M") {
          keys.push(ensureDoc(label, "M"));
        } else if (turno === "T") {
          keys.push(ensureDoc(label, "T"));
        } else {
          // Sem turno explícito: gera um único arquivo com o nome que você colocou
          keys.push(ensureDoc(label, ""));
        }

        (group.days || []).forEach((day) => {
          const diaIndex = idxDia(day.label);
          const contentId = day?.fields?.contentId;
          const homeworkId = day?.fields?.homeworkId;

          keys.forEach((k) => addAulaByKey(k, diaIndex, disciplina, contentId, homeworkId));
        });
      });
    });
  });

  // ordena as aulas de cada dia por disciplina (fica mais organizado)
  Object.values(docMap).forEach((doc) => {
    doc.dias.forEach((d) => {
      d.aulas.sort((a, b) => a.disciplina.localeCompare(b.disciplina, "pt-BR"));
    });
    // deixa o doc mais compacto: remove dias sem aulas
    doc.dias = doc.dias.filter((d) => d.aulas.length > 0);
  });

  return docMap;
}

function setupDocGeneration() {
  const gerarBtn = document.getElementById("gerar-doc");
  if (!gerarBtn) return;

  gerarBtn.addEventListener("click", async () => {
    const state = loadConfig();
    if (!state) {
      showToast("Nenhuma configuração encontrada.", "error");
      return;
    }

    // mapa id -> valor (pega o que você digitou no site)
    const campos = {};
    document.querySelectorAll(".card-textarea").forEach((input) => {
      campos[input.id] = input.value || "";
    });

    const data1 = document.getElementById("campo-data-1")?.value || "";
    const data2 = document.getElementById("campo-data-2")?.value || "";
    const campoData1 = formatarDataBR(data1);
    const campoData2 = formatarDataBR(data2);

    const docMap = buildDocsData(state, campos, campoData1, campoData2);

    const zip = new JSZip();
    const templateBuf = await fetch(`modelos/modelo-compacto.docx`).then((r) => r.arrayBuffer());

    // gera para toda e qualquer turma cadastrada (sem limitação 6º-9º)
    const keysOrdem = Object.keys(docMap).sort((a, b) => {
      // tenta ordenar por número (ex: "6", "7", etc) quando existir, e por turno M/T
      const pick = (k) => {
        const base = k.split("__")[0];
        const turno = (k.split("__")[1] || "").toUpperCase();
        const num = parseInt((base.match(/\d+/) || [])[0] || "9999", 10);
        const turnoRank = turno === "M" ? 0 : turno === "T" ? 1 : 2;
        return { num, turnoRank, base: base.toLowerCase(), raw: k.toLowerCase() };
      };
      const A = pick(a);
      const B = pick(b);
      if (A.num !== B.num) return A.num - B.num;
      if (A.turnoRank !== B.turnoRank) return A.turnoRank - B.turnoRank;
      // fallback: ordenação alfabética pelo nome da turma
      if (A.base !== B.base) return A.base.localeCompare(B.base, "pt-BR");
      return A.raw.localeCompare(B.raw, "pt-BR");
    });

    for (const key of keysOrdem) {
      const docData = docMap[key];
      if (!docData) continue;

      // se quiser sempre gerar mesmo vazio, comente o if abaixo
      if (!docData.dias || docData.dias.length === 0) continue;

      const zipInterno = new PizZip(templateBuf);
      const doc = new window.docxtemplater(zipInterno, {
        delimiters: { start: "{{", end: "}}" },
        nullGetter() { return "Não possui"; },
      });

      doc.setData(docData);
      doc.render();

      const blob = doc.getZip().generate({ type: "blob" });

      // nome de arquivo baseado no nome da turma (vale para qualquer turma)
      const rawTitle = (docData.turmaTitulo || key).toString();
      const safeTitle = rawTitle
        .replace(/[\\/:*?"<>|]/g, "")  // caracteres inválidos no Windows
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      zip.file(`Agenda-${safeTitle}.docx`, blob);
}

    const conteudoZip = await zip.generateAsync({ type: "blob" });
    saveAs(conteudoZip, "Agendas-Geradas.zip");
  });
}


function setupReportActions() {
  const refreshButton = document.getElementById("refresh-report");
  const downloadButton = document.getElementById("download-report");

  refreshButton?.addEventListener("click", () => {
    renderReport();
    showToast("Relatório atualizado.");
  });

  downloadButton?.addEventListener("click", () => {
    const report = document.getElementById("field-report");
    if (!report) return;
    const blob = new Blob([report.value], { type: "text/plain" });
    saveAs(blob, "relatorio-campos.txt");
  });
}

function setupGlobalShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const drawer = document.getElementById("agenda-drawer");
      if (drawer && drawer.classList.contains("is-open")) {
        document.getElementById("drawer-close")?.click();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupDrawer();
  setupSearch();
  setupDates();
  setupClearButton();
  setupDocGeneration();
  setupCardEvents();
  setupManagerEvents();
  setupReportActions();
  setupGlobalShortcuts();
  renderAll();
});
