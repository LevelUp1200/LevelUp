/**
 * LEVEL UP! – Calendar Script
 *
 * HOW THIS WORKS:
 * This file reads event data from a Google Sheet and builds the event cards.
 * The person managing the site just adds/edits rows in the Sheet — no code needed!
 *
 * GOOGLE SHEET COLUMN ORDER (important!):
 * Column A: Event title         (e.g. "Spelkväll & Anime-maraton")
 * Column B: Date                (e.g. "2025-06-02")   — use YYYY-MM-DD format
 * Column C: Time                (e.g. "16:00–20:00")
 * Column D: Description         (e.g. "Vi spelar, myser och tittar på anime!")
 * Column E: Image URL           (e.g. "https://...") — paste a direct image link, or leave blank for default
 *
 * TO CONNECT YOUR OWN SHEET:
 * 1. Open your Google Sheet
 * 2. File → Share → Publish to web → choose "Entire document" and "Tab-separated values" → Publish
 * 3. Copy the Sheet ID from the URL (the long string between /d/ and /edit)
 * 4. Paste it below where it says SHEET_ID
 * 5. Change SHEET_NAME to match the exact tab name in your Sheet
 */

const SHEET_ID   = "YOUR_SHEET_ID_HERE";   // ← Replace this!
const SHEET_NAME = "Events";               // ← Must match your sheet tab name exactly

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_NAME}`;

// Fallback image if no image URL is provided in the sheet
const DEFAULT_IMAGE = "img/leveluplogo.png";

// ─── Fetch and render ───────────────────────────────────────────────────────

fetch(SHEET_URL)
  .then(response => response.text())
  .then(raw => {
    // Google Sheets wraps the JSON in a function call — we strip that off
    const jsonText = raw.split("setResponse(")[1].slice(0, -2);
    const data     = JSON.parse(jsonText);
    const rows     = data.table.rows;

    if (!rows || rows.length === 0) {
      showError("Inga träffar hittades i kalendariet.");
      return;
    }

    const today    = new Date();
    today.setHours(0, 0, 0, 0);   // compare dates only, not time

    const upcoming = [];
    const past     = [];

    rows.forEach(row => {
      // Safely read each cell — if a cell is empty, use a fallback value
      const title       = row.c[0]?.v ?? "Träff";
      const dateStr     = row.c[1]?.v ?? "";
      const time        = row.c[2]?.v ?? "16:00–20:00";
      const description = row.c[3]?.v ?? "";
      const imageUrl    = row.c[4]?.v ?? DEFAULT_IMAGE;

      // Parse the date — Google Sheets sometimes returns "Date(2025,5,2)" format
      const eventDate = parseSheetDate(dateStr);

      const event = { title, date: eventDate, time, description, imageUrl };

      if (eventDate >= today) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    // Sort upcoming: soonest first. Sort past: most recent first.
    upcoming.sort((a, b) => a.date - b.date);
    past.sort((a, b) => b.date - a.date);

    renderEvents("upcomingEvents", upcoming, false);
    renderEvents("pastEvents",     past,     true);
  })
  .catch(err => {
    console.error("Could not load calendar data:", err);
    showError("Kunde inte ladda träffarna. Försök igen senare.");
  });


// ─── Build the HTML cards ───────────────────────────────────────────────────

function renderEvents(containerId, events, isPast) {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // clear the skeleton loaders

  if (events.length === 0) {
    container.innerHTML = `<p class="no-events">${isPast ? "Inga tidigare träffar ännu." : "Inga kommande träffar just nu — kolla igen snart!"}</p>`;
    return;
  }

  events.forEach((event, i) => {
    const isNext    = !isPast && i === 0;   // highlight the very next event
    const card      = document.createElement("div");
    card.className  = `event-card${isNext ? " event-next" : ""}${isPast ? " event-past" : ""}`;

    // Staggered entrance animation — each card slides in slightly later
    card.style.animationDelay = `${i * 0.1}s`;

    const formattedDate = event.date instanceof Date && !isNaN(event.date)
      ? event.date.toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : event.date;

    card.innerHTML = `
      <div class="event-img-wrap">
        <img
          src="${event.imageUrl}"
          alt="${event.title}"
          class="event-img"
          onerror="this.src='${DEFAULT_IMAGE}'"
        />
        ${isNext ? '<div class="event-badge">Nästa träff</div>' : ""}
        ${isPast ? '<div class="event-badge past-badge">Genomfört</div>' : ""}
      </div>
      <div class="event-body">
        <div class="event-date">${formattedDate}</div>
        <div class="event-time">⏰ ${event.time}</div>
        <div class="event-title">${event.title}</div>
        ${event.description ? `<div class="event-desc">${event.description}</div>` : ""}
      </div>
    `;

    container.appendChild(card);
  });
}


// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Google Sheets can return dates in two ways:
 *   1. As a string like "2025-06-02"
 *   2. As a Google date string like "Date(2025,5,2)"  ← note: months are 0-indexed!
 * This function handles both.
 */
function parseSheetDate(raw) {
  if (!raw) return new Date(NaN);

  // Format: Date(2025,5,2)
  const googleMatch = String(raw).match(/Date\((\d+),(\d+),(\d+)\)/);
  if (googleMatch) {
    return new Date(
      parseInt(googleMatch[1]),
      parseInt(googleMatch[2]),     // already 0-indexed
      parseInt(googleMatch[3])
    );
  }

  // Format: "2025-06-02"
  return new Date(raw);
}

function showError(message) {
  ["upcomingEvents", "pastEvents"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p class="no-events">${message}</p>`;
  });
}
