if (!localStorage.getItem("token")) {
  window.location.href = "auth.html";
}

const channelId = 3008487;
const readApiKey = "4E7OWSTNKK3PCWQ4";

const trashList = document.getElementById("trashList");
const fullList = document.getElementById("fullList");
const refreshBtn = document.getElementById("refreshBtn");
const clearBtn = document.getElementById("clearBtn");

function mapEventCode(code) {
  if (code === "1") return "Trash Thrown";
  if (code === "2") return "Bin Full";
  return "Unknown Event";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "auth.html";
}

async function getLastClearedTimestamp() {
  try {
    const res = await fetch("/api/last-cleared");
    const data = await res.json();
    return data.timestamp ? new Date(data.timestamp) : null;
  } catch (err) {
    console.error("Failed to get last cleared timestamp:", err);
    return null;
  }
}

async function fetchEvents() {
  trashList.innerHTML = `<li class="list-group-item text-center">Loading...</li>`;
  fullList.innerHTML = `<li class="list-group-item text-center">Loading...</li>`;

  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?results=50&api_key=${readApiKey}`;

  try {
    const [response, lastCleared] = await Promise.all([
      fetch(url),
      getLastClearedTimestamp(),
    ]);

    const data = await response.json();
    const feeds = data.feeds || [];

    trashList.innerHTML = "";
    fullList.innerHTML = "";

    feeds.forEach((feed) => {
      const eventCode = feed.field1;
      const time = new Date(feed.created_at);

      if (!eventCode) return;
      if (lastCleared && time <= lastCleared) return;

      const li = document.createElement("li");
      li.classList.add("list-group-item");
      li.innerHTML = `${time.toLocaleString()} (${mapEventCode(eventCode)})`;

      if (eventCode === "1") {
        trashList.appendChild(li);
      } else if (eventCode === "2") {
        fullList.appendChild(li);
      }
    });

    if (!trashList.hasChildNodes()) {
      trashList.innerHTML = `<li class="list-group-item text-center text-muted">No trash thrown events</li>`;
    }
    if (!fullList.hasChildNodes()) {
      fullList.innerHTML = `<li class="list-group-item text-center text-muted">No bin full events</li>`;
    }
  } catch (error) {
    trashList.innerHTML = `<li class="list-group-item text-center text-danger">Failed to load events.</li>`;
    fullList.innerHTML = `<li class="list-group-item text-center text-danger">Failed to load events.</li>`;
    console.error("Error fetching ThingSpeak data:", error);
  }
}

refreshBtn.addEventListener("click", fetchEvents);

clearBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to clear all events?")) return;

  trashList.innerHTML = `<li class="list-group-item text-center">Clearing...</li>`;
  fullList.innerHTML = `<li class="list-group-item text-center">Clearing...</li>`;

  try {
    const res = await fetch("/api/clear", { method: "POST" });
    if (!res.ok) throw new Error("Failed to clear events");

    trashList.innerHTML = `<li class="list-group-item text-center text-success">Events cleared.</li>`;
    fullList.innerHTML = `<li class="list-group-item text-center text-success">Events cleared.</li>`;
  } catch (err) {
    trashList.innerHTML = `<li class="list-group-item text-center text-danger">Failed to clear events.</li>`;
    fullList.innerHTML = `<li class="list-group-item text-center text-danger">Failed to clear events.</li>`;
    console.error(err);
  }
});

fetchEvents();
setInterval(fetchEvents, 15000);
