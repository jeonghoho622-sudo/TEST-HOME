import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

function isFirebaseConfigReady(config) {
  if (!config) return false;
  const required = ["apiKey", "authDomain", "projectId", "appId"];
  return required.every((key) => {
    const value = config[key];
    return typeof value === "string" && value.trim() && !value.includes("YOUR_");
  });
}

let db = null;
try {
  if (isFirebaseConfigReady(firebaseConfig)) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (e) {
  db = null;
}

const COL_GREETINGS = "pufferGreetings";
const COL_EVENTS = "pufferFamilyEvents";

let greetingsCache = [];
let eventsCache = [];

const lottoPanel = document.getElementById("lottoPanel");
const numbersEl = document.getElementById("numbers");
const messageEl = document.getElementById("message");
const historyListEl = document.getElementById("historyList");
const lottoGenerateBtn = document.getElementById("lottoGenerateBtn");
const familyMainImage = document.getElementById("familyMainImage");
const bgPuffer = document.getElementById("bgPuffer");

let history = JSON.parse(localStorage.getItem("pufferLottoHistory") || "[]");
let currentPufferIndex = 0;
let currentZoom = 1;
let selectedGalleryImage = "";
let editingEventId = null;
let editingFamilyNewsId = null;
let calendarCurrentDate = new Date();

const defaultGalleryImages = [
  "./하트.gif",
  "./복어.png",
  "./puffer.png"
];

    function lockBodyScroll() {
      document.body.style.overflow = "hidden";
    }

    function unlockBodyScrollIfNoModal() {
      const openedModal = document.querySelector(".modal-backdrop.show");
      if (!openedModal) {
        document.body.style.overflow = "";
      }
    }

    function setPreviewMode(mode) {
      const desktopBtn = document.getElementById("desktopModeBtn");
      const mobileBtn = document.getElementById("mobileModeBtn");

      if (mode === "mobile") {
        document.body.classList.add("force-mobile");
        localStorage.setItem("pufferPreviewMode", "mobile");
        desktopBtn.classList.remove("active");
        mobileBtn.classList.add("active");
      } else {
        document.body.classList.remove("force-mobile");
        localStorage.setItem("pufferPreviewMode", "desktop");
        desktopBtn.classList.add("active");
        mobileBtn.classList.remove("active");
      }
    }

    function loadPreviewMode() {
      const savedMode = localStorage.getItem("pufferPreviewMode") || "desktop";
      setPreviewMode(savedMode);
    }

    function closeAllEventRelatedModals() {
      closeEventModal();
      closeCalendarModal();
    }

    function saveLottoHistoryToStorage() {
      localStorage.setItem("pufferLottoHistory", JSON.stringify(history));
    }

function getGreetingsLocal() {
  return JSON.parse(localStorage.getItem("pufferGreetings") || "[]");
}

function saveGreetingsLocal(greetings) {
  localStorage.setItem("pufferGreetings", JSON.stringify(greetings));
}

function getFamilyEventsLocal() {
  const raw = JSON.parse(localStorage.getItem("pufferFamilyEvents") || "[]");

  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && Array.isArray(raw.daily)) {
    return raw.daily.map(event => {
      if (event.datetime) return event;

      return {
        id: event.id || String(Date.now()),
        datetime: event.date ? `${event.date}T09:00` : formatDateTimeLocalValue(new Date()),
        title: event.title || "",
        memo: event.memo || ""
      };
    });
  }

  return [];
}

function saveFamilyEventsLocal(events) {
  localStorage.setItem("pufferFamilyEvents", JSON.stringify(events));
}

function getGreetings() {
  return db ? greetingsCache : getGreetingsLocal();
}

function getFamilyEvents() {
  return db ? eventsCache : getFamilyEventsLocal();
}

async function refreshGreetingsFromStore() {
  if (!db) {
    greetingsCache = getGreetingsLocal();
    return greetingsCache;
  }

  const q = query(collection(db, COL_GREETINGS), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  greetingsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return greetingsCache;
}

async function refreshEventsFromStore() {
  if (!db) {
    eventsCache = getFamilyEventsLocal();
    return eventsCache;
  }

  const q = query(collection(db, COL_EVENTS), orderBy("datetimeTs", "asc"));
  const snap = await getDocs(q);
  eventsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return eventsCache;
}

    function getFamilyNews() {
      return JSON.parse(localStorage.getItem("pufferFamilyNews") || "[]");
    }

    function saveFamilyNewsToStorage(news) {
      localStorage.setItem("pufferFamilyNews", JSON.stringify(news));
    }

    function toggleLotto() {
      lottoPanel.classList.toggle("show");
      if (lottoPanel.classList.contains("show")) {
        lottoPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function getBallClass(number) {
      if (number <= 10) return "range-1";
      if (number <= 20) return "range-2";
      if (number <= 30) return "range-3";
      if (number <= 40) return "range-4";
      return "range-5";
    }

    function generateUniqueLottoNumbers() {
      const picked = [];
      while (picked.length < 6) {
        const random = Math.floor(Math.random() * 45) + 1;
        if (!picked.includes(random)) picked.push(random);
      }
      picked.sort((a, b) => a - b);
      return picked;
    }

    async function generateLotto() {
      const picked = generateUniqueLottoNumbers();
      lottoGenerateBtn.disabled = true;
      numbersEl.innerHTML = "";
      messageEl.textContent = "행운 번호를 고르는 중이에요...";

      await renderNumbersAnimated(picked);

      saveHistory(picked);
      messageEl.textContent = "오늘의 복어가족 행운 번호예요. 기분 좋은 하루 보내세요!";
      lottoGenerateBtn.disabled = false;
    }

    function renderNumbersAnimated(arr) {
      numbersEl.innerHTML = "";

      return new Promise((resolve) => {
        arr.forEach((number, index) => {
          setTimeout(() => {
            const ball = document.createElement("div");
            ball.className = `ball ${getBallClass(number)}`;
            ball.textContent = number;
            numbersEl.appendChild(ball);

            if (index === arr.length - 1) {
              resolve();
            }
          }, index * 180);
        });
      });
    }

    function saveHistory(arr) {
      const text = arr.join(", ");
      history.unshift(text);
      if (history.length > 5) history.pop();
      saveLottoHistoryToStorage();
      renderHistory();
    }

    function renderHistory() {
      historyListEl.innerHTML = "";

      if (history.length === 0) {
        historyListEl.innerHTML = '<li class="empty">아직 추천 기록이 없습니다.</li>';
        return;
      }

      history.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}번 추천: ${item}`;
        historyListEl.appendChild(li);
      });
    }

    function resetAll() {
      numbersEl.innerHTML = "";
      history = [];
      saveLottoHistoryToStorage();
      renderHistory();
      messageEl.textContent = "복어가족의 행운을 한 번 뽑아 보세요.";
      lottoGenerateBtn.disabled = false;
    }

async function saveGreeting() {
  const name = document.getElementById("guestName").value.trim();
  const msg = document.getElementById("guestMessage").value.trim();

  if (!name || !msg) {
    alert("이름과 인사말을 입력해주세요.");
    return;
  }

  if (db) {
    await addDoc(collection(db, COL_GREETINGS), {
      name,
      msg,
      date: new Date().toLocaleString("ko-KR"),
      createdAt: serverTimestamp()
    });
  } else {
    const greetings = getGreetingsLocal();
    greetings.unshift({ name, msg, date: new Date().toLocaleString("ko-KR") });
    saveGreetingsLocal(greetings.slice(0, 50));
  }

  document.getElementById("guestName").value = "";
  document.getElementById("guestMessage").value = "";

  await refreshGreetingsFromStore();
  loadGreetings();
  renderGreetingModalList();
}

function loadGreetings() {
  const list = document.getElementById("greetingList");
  const greetings = getGreetings();

  list.innerHTML = "";

  if (greetings.length === 0) {
    const empty = document.createElement("div");
    empty.className = "greeting-item";
    empty.textContent = "아직 저장된 인사말이 없습니다.";
    list.appendChild(empty);
    return;
  }

  const recentGreetings = greetings.slice(0, 3);

  recentGreetings.forEach((greeting, index) => {
    const item = document.createElement("div");
    item.className = "greeting-item";

    const header = document.createElement("div");
    header.className = "greeting-header";

    const name = document.createElement("strong");
    name.textContent = greeting.name;

    const date = document.createElement("span");
    date.className = "greeting-date";
    date.textContent = greeting.date || "";

    const msg = document.createElement("div");
    msg.textContent = greeting.msg;

    const actions = document.createElement("div");
    actions.className = "greeting-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn delete";
    deleteBtn.textContent = "삭제";
    deleteBtn.onclick = function () {
      deleteGreeting(greeting.id || index);
    };

    actions.appendChild(deleteBtn);
    header.appendChild(name);
    header.appendChild(date);
    item.appendChild(header);
    item.appendChild(msg);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

async function deleteGreeting(idOrIndex) {
  if (db) {
    if (typeof idOrIndex !== "string") return;
    await deleteDoc(doc(db, COL_GREETINGS, idOrIndex));
  } else {
    const greetings = getGreetingsLocal();
    greetings.splice(idOrIndex, 1);
    saveGreetingsLocal(greetings);
  }

  await refreshGreetingsFromStore();
  loadGreetings();
  renderGreetingModalList();
}

    function openGreetingModal() {
      renderGreetingModalList();
      document.getElementById("greetingModal").classList.add("show");
      lockBodyScroll();
    }

    function closeGreetingModal() {
      document.getElementById("greetingModal").classList.remove("show");
      unlockBodyScrollIfNoModal();
    }

function renderGreetingModalList() {
  const container = document.getElementById("greetingModalList");
  const greetings = getGreetings();

  container.innerHTML = "";

  if (greetings.length === 0) {
    const empty = document.createElement("div");
    empty.className = "greeting-modal-item";
    empty.textContent = "아직 저장된 인사말이 없습니다.";
    container.appendChild(empty);
    return;
  }

  greetings.forEach((greeting, index) => {
    const item = document.createElement("div");
    item.className = "greeting-modal-item";

    const header = document.createElement("div");
    header.className = "greeting-modal-header";

    const meta = document.createElement("div");
    meta.className = "greeting-modal-meta";

    const name = document.createElement("strong");
    name.textContent = greeting.name;

    const date = document.createElement("span");
    date.className = "greeting-date";
    date.textContent = greeting.date || "";

    meta.appendChild(name);
    meta.appendChild(date);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn delete";
    deleteBtn.textContent = "삭제";
    deleteBtn.onclick = function () {
      deleteGreeting(greeting.id || index);
    };

    const message = document.createElement("div");
    message.className = "greeting-modal-message";
    message.textContent = greeting.msg;

    header.appendChild(meta);
    header.appendChild(deleteBtn);

    item.appendChild(header);
    item.appendChild(message);

    container.appendChild(item);
  });
}

    function formatDateTimeLocalValue(date) {
      const pad = (num) => String(num).padStart(2, "0");

      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    function formatFamilyEventDate(value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "오후" : "오전";

      hours = hours % 12;
      if (hours === 0) hours = 12;

      return `${year}-${month}-${day} ${ampm} ${hours}:${minutes}`;
    }

    function formatCalendarTitle(date) {
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    }

    function getDateKey(dateObj) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    function getEventDateKey(datetimeValue) {
      const date = new Date(datetimeValue);
      if (isNaN(date.getTime())) return "";
      return getDateKey(date);
    }

    function isSameDate(a, b) {
      return a.getFullYear() === b.getFullYear() &&
             a.getMonth() === b.getMonth() &&
             a.getDate() === b.getDate();
    }

    function getNearestEvents(list, count = 3) {
      if (!list.length) return [];

      const now = new Date();

      const futureEvents = list
        .filter(item => new Date(item.datetime) >= now)
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      if (futureEvents.length >= count) {
        return futureEvents.slice(0, count);
      }

      const pastEvents = list
        .filter(item => new Date(item.datetime) < now)
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

      return [...futureEvents, ...pastEvents].slice(0, count);
    }

function getSortedEvents() {
  const events = getFamilyEvents();
  return [...events].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
}

    function updateEventEditUI() {
      const saveBtn = document.getElementById("familyEventSaveBtn");
      const cancelBtn = document.getElementById("familyEventCancelBtn");
      const titleEl = document.getElementById("eventEditorTitle");

      if (editingEventId !== null) {
        saveBtn.textContent = "행사 수정 완료";
        cancelBtn.classList.add("show");
        titleEl.textContent = "가족행사 수정";
      } else {
        saveBtn.textContent = "가족행사 저장";
        cancelBtn.classList.remove("show");
        titleEl.textContent = "가족행사 입력";
      }
    }

    function resetFamilyEventForm() {
      document.getElementById("familyEventDateTime").value = "";
      document.getElementById("familyEventTitle").value = "";
      document.getElementById("familyEventMemo").value = "";

      editingEventId = null;
      updateEventEditUI();
    }

    function cancelFamilyEventEdit() {
      resetFamilyEventForm();
      document.getElementById("familyEventDateTime").focus();
    }

    function openEventEditorModalForNew() {
      resetFamilyEventForm();
      document.getElementById("eventEditorModal").classList.add("show");
      lockBodyScroll();
      setTimeout(() => {
        document.getElementById("familyEventDateTime").focus();
      }, 100);
    }

    function openEventEditorModalWithDate(dateObj) {
      resetFamilyEventForm();

      const selectedDate = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        9,
        0
      );

      document.getElementById("familyEventDateTime").value = formatDateTimeLocalValue(selectedDate);

      closeAllEventRelatedModals();

      document.getElementById("eventEditorModal").classList.add("show");
      lockBodyScroll();

      setTimeout(() => {
        document.getElementById("familyEventTitle").focus();
      }, 120);
    }

    function closeEventEditorModal() {
      document.getElementById("eventEditorModal").classList.remove("show");
      resetFamilyEventForm();
      unlockBodyScrollIfNoModal();
    }

    function startEditFamilyEvent(eventData) {
      document.getElementById("familyEventDateTime").value = eventData.datetime || "";
      document.getElementById("familyEventTitle").value = eventData.title || "";
      document.getElementById("familyEventMemo").value = eventData.memo || "";
      editingEventId = eventData.id;
      updateEventEditUI();

      closeAllEventRelatedModals();

      document.getElementById("eventEditorModal").classList.add("show");
      lockBodyScroll();

      setTimeout(() => {
        document.getElementById("familyEventTitle").focus();
      }, 120);
    }

async function saveFamilyEvent() {
  const datetime = document.getElementById("familyEventDateTime").value;
  const title = document.getElementById("familyEventTitle").value.trim();
  const memo = document.getElementById("familyEventMemo").value.trim();

  if (!datetime) {
    alert("행사 날짜와 시간을 선택해주세요.");
    return;
  }

  if (!title) {
    alert("행사 제목을 입력해주세요.");
    return;
  }

  const datetimeDate = new Date(datetime);
  const datetimeTs = isNaN(datetimeDate.getTime()) ? null : Timestamp.fromDate(datetimeDate);

  if (db) {
    if (editingEventId !== null) {
      await updateDoc(doc(db, COL_EVENTS, editingEventId), {
        datetime,
        title,
        memo,
        datetimeTs,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, COL_EVENTS), {
        datetime,
        title,
        memo,
        datetimeTs,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } else {
    const events = getFamilyEventsLocal();

    if (editingEventId !== null) {
      const target = events.find(event => event.id === editingEventId);
      if (target) {
        target.datetime = datetime;
        target.title = title;
        target.memo = memo;
      }
    } else {
      events.unshift({
        id: String(Date.now()),
        datetime,
        title,
        memo
      });
    }

    events.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    saveFamilyEventsLocal(events);
  }

  await refreshEventsFromStore();
  renderFamilyEvents();
  renderEventModalList();
  renderCalendar();
  closeEventEditorModal();
}

async function deleteFamilyEvent(id) {
  if (db) {
    await deleteDoc(doc(db, COL_EVENTS, id));
  } else {
    const events = getFamilyEventsLocal().filter(event => event.id !== id);
    saveFamilyEventsLocal(events);
  }

  if (editingEventId === id) {
    resetFamilyEventForm();
  }

  await refreshEventsFromStore();
  renderFamilyEvents();
  renderEventModalList();
  renderCalendar();
}

function renderFamilyEvents() {
  const container = document.getElementById("familyEventList");
  if (!container) return;

  const events = getFamilyEvents();
  container.innerHTML = "";

  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "event-item editable";
    empty.textContent = "저장된 가족행사가 없습니다. 클릭해서 새 일정을 입력해 보세요.";
    empty.onclick = function () {
      openEventEditorModalForNew();
    };
    container.appendChild(empty);
    return;
  }

  const nearestEvents = getNearestEvents(events, 3);

  nearestEvents.forEach((eventData) => {
    const item = document.createElement("div");
    item.className = "event-item editable";
    item.title = "클릭해서 수정";
    item.onclick = function (e) {
      e.stopPropagation();
      startEditFamilyEvent(eventData);
    };

        const header = document.createElement("div");
        header.className = "event-item-header";

        const left = document.createElement("div");

        const title = document.createElement("div");
        title.className = "event-title";
        title.textContent = eventData.title;

        const date = document.createElement("div");
        date.className = "event-date";
        date.textContent = formatFamilyEventDate(eventData.datetime);

        left.appendChild(title);
        left.appendChild(date);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "event-delete-btn";
    deleteBtn.textContent = "삭제";
    deleteBtn.onclick = function (e) {
      e.stopPropagation();
      deleteFamilyEvent(eventData.id);
    };

        header.appendChild(left);
        header.appendChild(deleteBtn);

        item.appendChild(header);

        const memo = document.createElement("div");
        memo.className = "event-memo";
        memo.textContent = eventData.memo ? eventData.memo : "등록된 행사내용이 없습니다.";
        item.appendChild(memo);

    container.appendChild(item);
  });
}

    function openEventModal() {
      renderEventModalList();
      document.getElementById("eventModal").classList.add("show");
      lockBodyScroll();
    }

    function closeEventModal() {
      document.getElementById("eventModal").classList.remove("show");
      unlockBodyScrollIfNoModal();
    }

function renderEventModalList() {
  const container = document.getElementById("eventModalList");
  if (!container) return;

  const events = getSortedEvents();
  container.innerHTML = "";

  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "event-modal-item";
    empty.textContent = "저장된 가족행사가 없습니다.";
    container.appendChild(empty);
    return;
  }

  events.forEach((eventData) => {
    const item = document.createElement("div");
    item.className = "event-modal-item";
    item.title = "클릭해서 수정";
    item.onclick = function () {
      startEditFamilyEvent(eventData);
    };

        const header = document.createElement("div");
        header.className = "event-modal-header";

        const meta = document.createElement("div");
        meta.className = "event-modal-meta";

        const title = document.createElement("strong");
        title.textContent = eventData.title;

        const date = document.createElement("span");
        date.className = "event-date";
        date.textContent = formatFamilyEventDate(eventData.datetime);

        meta.appendChild(title);
        meta.appendChild(date);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "small-btn delete";
        deleteBtn.textContent = "삭제";
    deleteBtn.onclick = function (e) {
      e.stopPropagation();
      deleteFamilyEvent(eventData.id);
    };

        const message = document.createElement("div");
        message.className = "event-modal-message";
        message.textContent = eventData.memo ? eventData.memo : "등록된 행사내용이 없습니다.";

        header.appendChild(meta);
        header.appendChild(deleteBtn);
        item.appendChild(header);
        item.appendChild(message);

    container.appendChild(item);
  });
}

    function openCalendarModal() {
      calendarCurrentDate = new Date();
      renderCalendar();
      document.getElementById("calendarModal").classList.add("show");
      lockBodyScroll();
    }

    function closeCalendarModal() {
      document.getElementById("calendarModal").classList.remove("show");
      unlockBodyScrollIfNoModal();
    }

    function moveCalendarMonth(diff) {
      if (diff === 0) {
        calendarCurrentDate = new Date();
      } else {
        calendarCurrentDate = new Date(
          calendarCurrentDate.getFullYear(),
          calendarCurrentDate.getMonth() + diff,
          1
        );
      }
      renderCalendar();
    }

    function renderCalendar() {
      const titleEl = document.getElementById("calendarTitle");
      const gridEl = document.getElementById("calendarGrid");
      if (!titleEl || !gridEl) return;

      const currentYear = calendarCurrentDate.getFullYear();
      const currentMonth = calendarCurrentDate.getMonth();

      titleEl.textContent = formatCalendarTitle(calendarCurrentDate);
      gridEl.innerHTML = "";

      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);

      const startWeekday = firstDay.getDay();
      const daysInMonth = lastDay.getDate();

      const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
      const today = new Date();

      const events = getSortedEvents();
      const eventMap = new Map();

      events.forEach(event => {
        const key = getEventDateKey(event.datetime);
        if (!eventMap.has(key)) {
          eventMap.set(key, []);
        }
        eventMap.get(key).push(event);
      });

      const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement("div");
        cell.className = "calendar-cell";

        let cellDate;

        if (i < startWeekday) {
          const day = prevMonthLastDay - startWeekday + i + 1;
          cellDate = new Date(currentYear, currentMonth - 1, day);
          cell.classList.add("other-month");
        } else if (i >= startWeekday + daysInMonth) {
          const day = i - (startWeekday + daysInMonth) + 1;
          cellDate = new Date(currentYear, currentMonth + 1, day);
          cell.classList.add("other-month");
        } else {
          const day = i - startWeekday + 1;
          cellDate = new Date(currentYear, currentMonth, day);
        }

        if (isSameDate(cellDate, today)) {
          cell.classList.add("today");
        }

        cell.title = `${getDateKey(cellDate)} 날짜에 일정 입력`;
        cell.onclick = function () {
          openEventEditorModalWithDate(cellDate);
        };

        const dateNumber = document.createElement("div");
        dateNumber.className = "calendar-date-number";
        dateNumber.textContent = cellDate.getDate();

        const eventList = document.createElement("div");
        eventList.className = "calendar-event-list";

        const key = getDateKey(cellDate);
        const dayEvents = eventMap.get(key) || [];

        if (dayEvents.length === 0) {
          const empty = document.createElement("div");
          empty.className = "calendar-empty";
          empty.textContent = " ";

          const action = document.createElement("div");
          action.className = "calendar-empty-action";
          action.textContent = "일정 입력";

          eventList.appendChild(empty);
          eventList.appendChild(action);
        } else {
          dayEvents.slice(0, 3).forEach(eventData => {
            const chip = document.createElement("div");
            chip.className = "calendar-event-chip";
            chip.title = "클릭해서 수정";
            chip.innerHTML = `
              <strong>${new Date(eventData.datetime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</strong><br>
              ${eventData.title}
            `;
            chip.onclick = function (e) {
              e.stopPropagation();
              startEditFamilyEvent(eventData);
            };
            eventList.appendChild(chip);
          });

          if (dayEvents.length > 3) {
            const more = document.createElement("div");
            more.className = "calendar-empty";
            more.textContent = `외 ${dayEvents.length - 3}건`;
            eventList.appendChild(more);
          }

          const action = document.createElement("div");
          action.className = "calendar-empty-action";
          action.textContent = "날짜 클릭 시 새 일정 입력";
          eventList.appendChild(action);
        }

        cell.appendChild(dateNumber);
        cell.appendChild(eventList);
        gridEl.appendChild(cell);
      }
    }

    function updateFamilyNewsEditUI() {
      const saveBtn = document.getElementById("familyNewsSaveBtn");
      const cancelBtn = document.getElementById("familyNewsCancelBtn");

      if (!saveBtn || !cancelBtn) return;

      if (editingFamilyNewsId !== null) {
        saveBtn.textContent = "소식 수정 완료";
        cancelBtn.classList.add("show");
      } else {
        saveBtn.textContent = "소식 저장";
        cancelBtn.classList.remove("show");
      }
    }

    function resetFamilyNewsForm() {
      document.getElementById("familyNewsTitle").value = "";
      document.getElementById("familyNewsContent").value = "";
      editingFamilyNewsId = null;
      updateFamilyNewsEditUI();
    }

    function cancelFamilyNewsEdit() {
      resetFamilyNewsForm();
      document.getElementById("familyNewsTitle").focus();
    }

    function startEditFamilyNews(item) {
      openFamilyNewsModal();

      document.getElementById("familyNewsTitle").value = item.title || "";
      document.getElementById("familyNewsContent").value = item.content || "";
      editingFamilyNewsId = item.id;
      updateFamilyNewsEditUI();

      setTimeout(() => {
        document.getElementById("familyNewsTitle").focus();
      }, 100);
    }

    function renderFamilyNewsPreview() {
      const container = document.getElementById("familyNewsPreview");
      if (!container) return;

      const news = getFamilyNews();
      container.innerHTML = "";

      if (news.length === 0) {
        const empty = document.createElement("div");
        empty.className = "news-mini-item";
        empty.textContent = "아직 등록된 복어가족 소식이 없습니다.";
        container.appendChild(empty);
        return;
      }

      news.slice(0, 3).forEach(item => {
        const div = document.createElement("div");
        div.className = "news-mini-item";
        div.onclick = function () {
          startEditFamilyNews(item);
        };
        div.innerHTML = `
          ${item.title}
          <span class="news-mini-date">${item.date}</span>
        `;
        container.appendChild(div);
      });
    }

    function renderFamilyNewsList() {
      const container = document.getElementById("familyNewsList");
      if (!container) return;

      const news = getFamilyNews();
      container.innerHTML = "";

      if (news.length === 0) {
        const empty = document.createElement("div");
        empty.className = "family-news-item";
        empty.textContent = "아직 저장된 소식이 없습니다.";
        container.appendChild(empty);
        return;
      }

      news.forEach(item => {
        const box = document.createElement("div");
        box.className = "family-news-item";
        box.title = "클릭해서 수정";
        box.onclick = function () {
          startEditFamilyNews(item);
        };

        const header = document.createElement("div");
        header.className = "family-news-item-header";

        const left = document.createElement("div");

        const title = document.createElement("div");
        title.className = "family-news-title";
        title.textContent = item.title;

        const date = document.createElement("div");
        date.className = "family-news-date";
        date.textContent = item.date;

        left.appendChild(title);
        left.appendChild(date);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "small-btn delete";
        deleteBtn.textContent = "삭제";
        deleteBtn.onclick = function (e) {
          e.stopPropagation();
          deleteFamilyNews(item.id);
        };

        header.appendChild(left);
        header.appendChild(deleteBtn);

        const content = document.createElement("div");
        content.className = "family-news-content";
        content.textContent = item.content;

        box.appendChild(header);
        box.appendChild(content);

        container.appendChild(box);
      });
    }

    function openFamilyNewsModal() {
      renderFamilyNewsList();
      updateFamilyNewsEditUI();
      document.getElementById("familyNewsModal").classList.add("show");
      lockBodyScroll();
    }

    function closeFamilyNewsModal() {
      document.getElementById("familyNewsModal").classList.remove("show");
      resetFamilyNewsForm();
      unlockBodyScrollIfNoModal();
    }

    function saveFamilyNews() {
      const title = document.getElementById("familyNewsTitle").value.trim();
      const content = document.getElementById("familyNewsContent").value.trim();

      if (!title) {
        alert("소식 제목을 입력해주세요.");
        return;
      }

      if (!content) {
        alert("소식 내용을 입력해주세요.");
        return;
      }

      const news = getFamilyNews();

      if (editingFamilyNewsId !== null) {
        const target = news.find(item => item.id === editingFamilyNewsId);
        if (target) {
          target.title = title;
          target.content = content;
          target.date = new Date().toLocaleString("ko-KR");
        }
      } else {
        news.unshift({
          id: Date.now(),
          title,
          content,
          date: new Date().toLocaleString("ko-KR")
        });
      }

      saveFamilyNewsToStorage(news.slice(0, 50));
      resetFamilyNewsForm();
      renderFamilyNewsPreview();
      renderFamilyNewsList();
    }

    function deleteFamilyNews(id) {
      const news = getFamilyNews().filter(item => item.id !== id);
      saveFamilyNewsToStorage(news);

      if (editingFamilyNewsId === id) {
        resetFamilyNewsForm();
      }

      renderFamilyNewsPreview();
      renderFamilyNewsList();
    }

    function getUploadedPufferImages() {
      return JSON.parse(localStorage.getItem("pufferGallery") || "[]");
    }

    function getAllRepresentativeCandidates() {
      const uploaded = getUploadedPufferImages();
      const merged = [...defaultGalleryImages, ...uploaded];
      return [...new Set(merged)];
    }

    function setRepresentativeImage(src) {
      familyMainImage.src = src;
      bgPuffer.src = src;
      localStorage.setItem("pufferMainImage", src);
    }

    function loadRepresentativeImage() {
      const saved = localStorage.getItem("pufferMainImage");
      const fallback = defaultGalleryImages[0];

      if (saved) {
        setRepresentativeImage(saved);
      } else {
        setRepresentativeImage(fallback);
      }
    }

    function openGallery(src) {
      const modal = document.getElementById("imageModal");
      const main = document.getElementById("galleryMain");
      const thumbs = document.getElementById("galleryThumbs");
      const images = getAllRepresentativeCandidates();

      selectedGalleryImage = src || familyMainImage.src || images[0] || defaultGalleryImages[0];
      main.src = selectedGalleryImage;
      thumbs.innerHTML = "";

      images.forEach(img => {
        const thumb = document.createElement("img");
        thumb.src = img;
        thumb.alt = "썸네일";

        if (img === selectedGalleryImage) {
          thumb.classList.add("active");
        }

        thumb.onclick = function () {
          selectedGalleryImage = img;
          main.src = img;

          thumbs.querySelectorAll("img").forEach(t => t.classList.remove("active"));
          thumb.classList.add("active");
        };

        thumbs.appendChild(thumb);
      });

      modal.classList.add("show");
      lockBodyScroll();
    }

    function applySelectedRepresentative() {
      if (!selectedGalleryImage) return;
      setRepresentativeImage(selectedGalleryImage);
      closeGallery();
    }

    function closeGallery() {
      document.getElementById("imageModal").classList.remove("show");
      unlockBodyScrollIfNoModal();
    }

    function openPufferGallery() {
      let modal = document.getElementById("pufferGallery");

      if (!modal) {
        modal = document.createElement("div");
        modal.id = "pufferGallery";
        modal.className = "modal-backdrop";

        modal.innerHTML = `
          <div class="modal-panel">
            <button class="modal-close" onclick="closePufferGallery()">닫기</button>
            <h2 style="margin-top:0;">복어 사진 갤러리</h2>
            <p style="color:#7f8191;">사진을 업로드하고, 클릭해서 크게 볼 수 있어요. 업로드한 사진은 대표 사진으로도 사용할 수 있어요.</p>
            <div class="puffer-upload-wrap">
              <input type="file" id="pufferUpload" accept="image/*">
            </div>
            <div id="pufferImages" class="gallery-grid"></div>
          </div>
        `;

        document.body.appendChild(modal);
        document.getElementById("pufferUpload").addEventListener("change", savePufferImage);

        modal.addEventListener("click", function (e) {
          if (e.target === modal) {
            closePufferGallery();
          }
        });
      }

      modal.classList.add("show");
      lockBodyScroll();
      loadPufferImages();
    }

    function closePufferGallery() {
      const modal = document.getElementById("pufferGallery");
      if (modal) modal.classList.remove("show");
      unlockBodyScrollIfNoModal();
    }

    function savePufferImage(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = function (evt) {
        const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
        imgs.unshift(evt.target.result);

        try {
          localStorage.setItem("pufferGallery", JSON.stringify(imgs.slice(0, 30)));
          loadPufferImages();
        } catch (err) {
          alert("저장 공간이 부족합니다. 기존 사진 수를 줄이거나 작은 이미지를 사용해 주세요.");
        }
      };

      reader.readAsDataURL(file);
      e.target.value = "";
    }

    function deletePufferImage(index) {
      const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
      const removed = imgs[index];
      imgs.splice(index, 1);
      localStorage.setItem("pufferGallery", JSON.stringify(imgs));

      const currentRepresentative = localStorage.getItem("pufferMainImage");
      if (currentRepresentative === removed) {
        const candidates = getAllRepresentativeCandidates();
        const replacement = candidates[0] || defaultGalleryImages[0];
        setRepresentativeImage(replacement);
      }

      loadPufferImages();
    }

    function loadPufferImages() {
      const container = document.getElementById("pufferImages");
      if (!container) return;

      const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
      container.innerHTML = "";

      if (imgs.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = "저장된 복어 사진이 없습니다. 사진을 업로드해 주세요.";
        empty.style.color = "#666";
        empty.style.padding = "8px 0";
        container.appendChild(empty);
        return;
      }

      imgs.forEach((src, index) => {
        const wrap = document.createElement("div");
        wrap.className = "gallery-thumb-wrap";

        const img = document.createElement("img");
        img.src = src;
        img.alt = `복어 사진 ${index + 1}`;
        img.onclick = function () {
          openPufferViewer(index);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "gallery-delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.title = "삭제";
        deleteBtn.onclick = function (e) {
          e.stopPropagation();
          deletePufferImage(index);
        };

        wrap.appendChild(img);
        wrap.appendChild(deleteBtn);
        container.appendChild(wrap);
      });
    }

    function openPufferViewer(index) {
      const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
      if (!imgs.length) return;

      currentPufferIndex = index;
      currentZoom = 1;

      let viewer = document.getElementById("pufferViewer");

      if (!viewer) {
        viewer = document.createElement("div");
        viewer.id = "pufferViewer";
        viewer.className = "modal-backdrop";

        viewer.innerHTML = `
          <div class="viewer-shell">
            <button class="viewer-close" onclick="closePufferViewer()">닫기 ✕</button>
            <button class="viewer-nav viewer-prev" onclick="prevPufferImage()">◀</button>
            <img id="viewerImage" class="viewer-image" alt="복어 확대 이미지">
            <button class="viewer-nav viewer-next" onclick="nextPufferImage()">▶</button>

            <div class="viewer-controls">
              <button class="viewer-zoom" onclick="zoomOutPufferImage()">－</button>
              <button class="viewer-zoom" onclick="resetZoomPufferImage()">원래 크기</button>
              <button class="viewer-zoom" onclick="zoomInPufferImage()">＋</button>
              <button class="viewer-zoom" onclick="setCurrentUploadedAsRepresentative()">대표 사진으로 적용</button>
            </div>
          </div>
        `;

        document.body.appendChild(viewer);

        viewer.addEventListener("click", function (e) {
          if (e.target === viewer) {
            closePufferViewer();
          }
        });
      }

      updatePufferViewerImage();
      viewer.classList.add("show");
      lockBodyScroll();
    }

    function updatePufferViewerImage() {
      const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
      const viewerImage = document.getElementById("viewerImage");
      if (!imgs.length || !viewerImage) return;

      if (currentPufferIndex < 0) currentPufferIndex = imgs.length - 1;
      if (currentPufferIndex >= imgs.length) currentPufferIndex = 0;

      viewerImage.src = imgs[currentPufferIndex];
      viewerImage.style.transform = `scale(${currentZoom})`;
    }

    function prevPufferImage() {
      const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
      if (!imgs.length) return;
      currentPufferIndex = (currentPufferIndex - 1 + imgs.length) % imgs.length;
      currentZoom = 1;
      updatePufferViewerImage();
    }

    function nextPufferImage() {
      const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
      if (!imgs.length) return;
      currentPufferIndex = (currentPufferIndex + 1) % imgs.length;
      currentZoom = 1;
      updatePufferViewerImage();
    }

    function zoomInPufferImage() {
      currentZoom = Math.min(currentZoom + 0.25, 3);
      updatePufferViewerImage();
    }

    function zoomOutPufferImage() {
      currentZoom = Math.max(currentZoom - 0.25, 0.5);
      updatePufferViewerImage();
    }

    function resetZoomPufferImage() {
      currentZoom = 1;
      updatePufferViewerImage();
    }

    function setCurrentUploadedAsRepresentative() {
      const imgs = JSON.parse(localStorage.getItem("pufferGallery") || "[]");
      if (!imgs.length) return;
      setRepresentativeImage(imgs[currentPufferIndex]);
      closePufferViewer();
      closePufferGallery();
    }

    function closePufferViewer() {
      const viewer = document.getElementById("pufferViewer");
      if (viewer) viewer.classList.remove("show");
      unlockBodyScrollIfNoModal();
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeGallery();
        closeGreetingModal();
        closeEventModal();
        closeCalendarModal();
        closeEventEditorModal();
        closeFamilyNewsModal();
        closePufferGallery();
        closePufferViewer();
      }

      const viewer = document.getElementById("pufferViewer");
      if (viewer && viewer.classList.contains("show")) {
        if (e.key === "ArrowLeft") prevPufferImage();
        if (e.key === "ArrowRight") nextPufferImage();
        if (e.key === "+" || e.key === "=") zoomInPufferImage();
        if (e.key === "-") zoomOutPufferImage();
        if (e.key === "0") resetZoomPufferImage();
      }
    });

    document.getElementById("imageModal").addEventListener("click", function (e) {
      if (e.target === this) {
        closeGallery();
      }
    });

    document.getElementById("greetingModal").addEventListener("click", function (e) {
      if (e.target === this) {
        closeGreetingModal();
      }
    });

    document.getElementById("eventModal").addEventListener("click", function (e) {
      if (e.target === this) {
        closeEventModal();
      }
    });

    document.getElementById("calendarModal").addEventListener("click", function (e) {
      if (e.target === this) {
        closeCalendarModal();
      }
    });

    document.getElementById("eventEditorModal").addEventListener("click", function (e) {
      if (e.target === this) {
        closeEventEditorModal();
      }
    });

    document.getElementById("familyNewsModal").addEventListener("click", function (e) {
      if (e.target === this) {
        closeFamilyNewsModal();
      }
    });

    window.addEventListener("load", async function () {
      renderHistory();

      await refreshGreetingsFromStore();
      await refreshEventsFromStore();

      loadGreetings();
      renderGreetingModalList();
      loadRepresentativeImage();
      renderFamilyEvents();
      renderEventModalList();
      renderCalendar();
      renderFamilyNewsPreview();
      updateFamilyNewsEditUI();
      updateEventEditUI();
      loadPreviewMode();

      familyMainImage.onclick = function () {
        openGallery(familyMainImage.src);
      };

      familyMainImage.onerror = function () {
        setRepresentativeImage(defaultGalleryImages[0]);
      };
    });

    Object.assign(window, {
      setPreviewMode,
      toggleLotto,
      generateLotto,
      resetAll,

      saveGreeting,
      openGreetingModal,
      closeGreetingModal,

      openEventModal,
      closeEventModal,
      openCalendarModal,
      closeCalendarModal,
      moveCalendarMonth,
      openEventEditorModalForNew,
      closeEventEditorModal,
      saveFamilyEvent,
      cancelFamilyEventEdit,

      openFamilyNewsModal,
      closeFamilyNewsModal,
      saveFamilyNews,
      cancelFamilyNewsEdit,

      openGallery,
      closeGallery,
      applySelectedRepresentative,

      openPufferGallery,
      closePufferGallery,
      closePufferViewer,
      prevPufferImage,
      nextPufferImage,
      zoomInPufferImage,
      zoomOutPufferImage,
      resetZoomPufferImage,
      setCurrentUploadedAsRepresentative
    });
