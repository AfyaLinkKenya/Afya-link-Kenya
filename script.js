const SUPABASE_URL = "pipfgidanabbodduvxpa";
const SUPABASE_KEY = "sb_publishable_oTfBwshIuglFUFUmx0j9Gw_C9t-z9MW";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tables = {
  hospitals: {
    table: "hospitals",
    title: "Hospitals"
  },
  pharmacies: {
    table: "pharmacies",
    title: "Pharmacies"
  },
  medicines: {
    table: "medicines",
    title: "Medicines & Prices"
  }
};

let category = "hospitals";

const searchInput = document.getElementById("search");
const locationInput = document.getElementById("location");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("resultCount");
const titleEl = document.getElementById("resultsTitle");

function showMessage(message) {
  statusEl.textContent = message;
}

function makeText(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value == null ? "" : String(value);
  return element;
}

function displayResults(rows) {
  resultsEl.replaceChildren();
  countEl.textContent = rows.length + " found";

  if (!rows.length) {
    resultsEl.append(
      makeText("p", "", "No matching records found.")
    );
    return;
  }

  rows.forEach((item) => {
    const card = makeText("article", "result-card", "");
    const heading = makeText(
      "h3",
      "",
      item.name || item.hospital_name ||
      item.pharmacy_name || item.medicine_name ||
      item.drug_name || "Directory listing"
    );

    card.append(heading);

    const excluded = new Set([
      "id", "created_at", "updated_at"
    ]);

    Object.entries(item).forEach(([key, value]) => {
      if (value == null || excluded.has(key)) return;
      if (typeof value === "object") return;

      const label = key.replace(/_/g, " ");
      const isPrice = /price|cost/i.test(key);

      const line = makeText(
        "p",
        isPrice ? "price" : "",
        label + ": " + value
      );

      card.append(line);
    });

    resultsEl.append(card);
  });
}

async function searchDirectory() {
  const config = tables[category];
  const term = searchInput.value.trim().toLowerCase();
  const place = locationInput.value.trim().toLowerCase();

  titleEl.textContent = config.title;
  resultsEl.replaceChildren();
  countEl.textContent = "";
  showMessage("Loading records...");

  try {
    const { data, error } = await db
      .from(config.table)
      .select("*")
      .limit(100);

    if (error) throw error;

    const rows = (data || []).filter((item) => {
      const values = Object.entries(item)
        .filter(([key, value]) =>
          value != null &&
          !/id|created_at|updated_at/i.test(key) &&
          typeof value !== "object"
        )
        .map(([, value]) => String(value).toLowerCase());

      const matchesTerm =
        !term || values.some((value) => value.includes(term));

      const matchesPlace =
        !place || values.some((value) => value.includes(place));

      return matchesTerm && matchesPlace;
    });

    showMessage(
      "Showing records from your Supabase database."
    );
    displayResults(rows);
  } catch (error) {
    console.error("AfyaLink Supabase error:", error);
    showMessage(
      "Could not load records. Check the table name, database permissions and connection."
    );
    resultsEl.replaceChildren();
  }
}

document.querySelectorAll(".category").forEach((button) => {
  button.addEventListener("click", () => {
    category = button.dataset.category;

    document.querySelectorAll(".category").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    titleEl.textContent = tables[category].title;
    searchDirectory();
  });
});

document.getElementById("searchBtn").addEventListener(
  "click",
  searchDirectory
);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchDirectory();
});

locationInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchDirectory();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  searchInput.value = "";
  locationInput.value = "";
  searchDirectory();
});

if (window.supabase) {
  showMessage("Ready. Search to load your directory.");
} else {
  showMessage("Supabase library did not load. Check your HTML tab.");
}
