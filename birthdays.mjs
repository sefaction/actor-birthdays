const MODULE = "actor-birthdays";
const sheets = new WeakMap();
const dateChanged = "simple-calendar-date-time-change";
const icon = "fas fa-cake-candles";

function calendar() {
  const api = globalThis.SimpleCalendar?.api;
  const id = api?.getCurrentCalendar?.()?.id;
  const today = api?.currentDateTime?.();
  if (!id || !today) return null;
  return { api, id, today, months: api.getAllMonths() };
}

function compare(a, b) {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

function validDate(cal, date) {
  const stamp = cal.api.dateToTimestamp({ ...date, hour: 0, minute: 0, second: 0 });
  const result = Number.isFinite(stamp) && cal.api.timestampToDate(stamp);
  return result && compare(result, date) === 0;
}

function anniversary(cal, birth, year) {
  const month = cal.months.findIndex(({ id }) => id === birth.monthId);
  if (month < 0) return null;
  for (let day = birth.day; day >= 0; day--) {
    const date = { year, month, day };
    if (validDate(cal, date)) return date;
  }
  return null;
}

function age(cal, birth) {
  if (!cal || birth?.calendarId !== cal.id) return null;
  const years = cal.today.year - birth.year;
  if (years < 0) return null;
  const thisYear = anniversary(cal, birth, cal.today.year);
  if (!thisYear) return null;
  const result = years - Number(compare(cal.today, thisYear) < 0);
  return result >= 0 ? result : null;
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function openBirthday(actor) {
  const cal = calendar();
  if (!cal) {
    ui.notifications.warn("Actor Birthdays needs an active Simple Calendar calendar.");
    return;
  }
  const stored = actor.getFlag(MODULE, "birth");
  const birth = stored?.calendarId === cal.id ? stored : null;
  const currentAge = age(cal, birth);
  const editable = actor.isOwner && !actor.pack;
  const monthId = birth?.monthId ?? cal.months[cal.today.month]?.id;
  const months = cal.months.map((month, index) =>
    `<option value="${index}" ${month.id === monthId ? "selected" : ""}>${escapeHtml(month.name)}</option>`
  ).join("");
  const disabled = editable ? "" : "disabled";
  const content = `
    <p>${currentAge === null ? "Age unavailable" : `Age ${currentAge}`}</p>
    ${!birth ? "<p>No birthdate is set for this calendar.</p>" : ""}
    <form>
      <fieldset ${disabled}>
        <div class="form-group"><label for="birthday-year">Year</label>
          <input id="birthday-year" name="year" type="number" step="1" required value="${birth?.year ?? cal.today.year}"></div>
        <div class="form-group"><label for="birthday-month">Month</label>
          <select id="birthday-month" name="month">${months}</select></div>
        <div class="form-group"><label for="birthday-day">Day of month (1-based)</label>
          <input id="birthday-day" name="day" type="number" min="1" step="1" required value="${(birth?.day ?? cal.today.day) + 1}"></div>
        <div class="form-group"><label for="birthday-chat">Announce birthdays in public chat</label>
          <input id="birthday-chat" name="announce" type="checkbox" ${birth?.announce === false ? "" : "checked"}></div>
      </fieldset>
    </form>`;
  const buttons = { close: { label: "Close" } };
  let dialog;
  let saving = false;
  async function persist(change) {
    saving = true;
    try {
      await change();
      refreshSheets();
      await dialog.close();
    } catch (error) {
      console.error("Actor Birthdays | Could not save birthdate", error);
      ui.notifications.error("Actor Birthdays could not save the birthdate.");
    } finally {
      saving = false;
    }
  }
  if (editable) {
    buttons.save = {
      label: "Save",
      callback: (html) => {
        if (saving) return false;
        const form = (html instanceof HTMLElement ? html : html[0]).querySelector("form");
        if (!form.reportValidity()) return false;
        const fields = new FormData(form);
        const date = {
          year: Number(fields.get("year")),
          month: Number(fields.get("month")),
          day: Number(fields.get("day")) - 1
        };
        const active = calendar();
        if (active?.id !== cal.id || active.months[date.month]?.id !== cal.months[date.month]?.id
            || !Number.isSafeInteger(date.year) || !validDate(active, date)) {
          ui.notifications.warn("Enter a valid birthdate in the active calendar.");
          return false;
        }
        void persist(() => actor.setFlag(MODULE, "birth", {
          calendarId: cal.id, monthId: cal.months[date.month].id,
          year: date.year, day: date.day, announce: fields.has("announce")
        }));
        return false;
      }
    };
    if (stored) buttons.clear = {
      label: "Clear birthdate",
      callback: () => {
        if (!saving) void persist(() => actor.unsetFlag(MODULE, "birth"));
        return false;
      }
    };
  }
  const Dialog = foundry.appv1?.api?.Dialog ?? globalThis.Dialog;
  dialog = new Dialog({
    title: "Birthdate", content, buttons, default: "close"
  });
  dialog.render(true);
}

function updateButton(button, actor, cal) {
  const years = age(cal, actor.getFlag(MODULE, "birth"));
  button.lastElementChild.textContent = years === null ? " Birthdate" : ` Age ${years}`;
}

function refreshSheets() {
  const cal = calendar();
  for (const button of document.querySelectorAll(".actor-birthdays-control")) {
    updateButton(button, sheets.get(button), cal);
  }
}

function renderSheet(app, html) {
  const actor = app.actor ?? app.document;
  if (actor?.documentName !== "Actor" || actor.pack) return;
  const root = app.element instanceof HTMLElement ? app.element : html?.[0];
  const header = root?.querySelector(".window-header");
  if (!header) return;
  let button = header.querySelector(".actor-birthdays-control");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "header-control actor-birthdays-control";
    button.style.width = "auto";
    button.title = "View or edit birthdate";
    button.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span></span>`;
    button.addEventListener("click", () => openBirthday(actor));
    header.append(button);
    sheets.set(button, actor);
  }
  updateButton(button, actor, calendar());
}

let previous;
let pending = Promise.resolve();

async function announce(cal, from) {
  const isActiveGM = () => game.users.activeGM?.id === game.user.id;
  if (!isActiveGM()) return;
  const announced = new Set(game.messages.contents.map(message => message.getFlag(MODULE, "birthday")));
  for (const actor of game.actors) {
    const birth = actor.getFlag(MODULE, "birth");
    if (birth?.calendarId !== cal.id || !birth.announce) continue;
    const firstYear = Math.max(birth.year, from?.year ?? cal.today.year);
    for (let year = firstYear; year <= cal.today.year; year++) {
      const date = anniversary(cal, birth, year);
      if (!date || compare(date, cal.today) > 0) continue;
      if (from ? compare(date, from) <= 0 : compare(date, cal.today) !== 0) continue;
      const key = JSON.stringify([cal.id, actor.id, year]);
      if (announced.has(key)) continue;
      if (!isActiveGM()) return;
      const years = year - birth.year;
      const name = escapeHtml(actor.name);
      const content = years === 0 ? `Happy birthday, ${name}!` : `Happy birthday, ${name}! They turn ${years}.`;
      await ChatMessage.create({
        content: `<p>🎂 ${content}</p>`,
        speaker: { alias: "Birthdays" },
        flags: { [MODULE]: { birthday: key } }
      });
      announced.add(key);
    }
  }
}

function onCalendarChange() {
  const cal = calendar();
  if (!cal) return;
  const from = previous?.id === cal.id ? previous.today : null;
  const direction = from ? compare(cal.today, from) : 1;
  if (direction === 0) return;
  previous = cal;
  refreshSheets();
  if (direction > 0 && game.users.activeGM?.id === game.user.id) {
    pending = pending.then(() => announce(cal, from)).catch(error => {
      console.error("Actor Birthdays | Could not announce birthdays", error);
      ui.notifications.error("Actor Birthdays could not post a birthday announcement.");
    });
  }
}

Hooks.on("renderActorSheet", renderSheet);
Hooks.on("renderApplicationV2", renderSheet);
Hooks.on("updateActor", refreshSheets);
Hooks.once("ready", () => {
  Hooks.on(dateChanged, onCalendarChange);
  Hooks.on("simple-calendar-ready", onCalendarChange);
  onCalendarChange();
});
