const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Load data from JSON file
const dataPath = path.join(__dirname, "../Data/campaign_data.json");
const rawData = fs.readFileSync(dataPath);
const data = JSON.parse(rawData);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// filter data by  campaign_name
function filterByCampaign(campaign_name) {
  console.log("--- filterByCampaign ---");
  console.log("campaign_name:", campaign_name);

  return campaign_name ? data.filter((d) => d.campaign_name === campaign_name) : data;
}

// list all unique campaign names
app.get("/api/campaigns", (req, res) => {
  const campaigns = [...new Set(data.map((d) => d.campaign_name))].sort();
  res.json(campaigns);
});

// GET /api/event-counts?campaign=<name>
app.get("/api/event-counts", (req, res) => {
  const subset = filterByCampaign(req.query.campaign);
  const counts = {};
  subset.forEach((event) => {
    counts[event.campaign_event_type] =
      (counts[event.campaign_event_type] || 0) + 1;
  });
  const result = Object.entries(counts).map(([type, count]) => ({ type, count }));
  res.json(result);
});

// GET /api/text-delivered?campaign=<name>
app.get("/api/text-delivered", (req, res) => {
  const subset = filterByCampaign(req.query.campaign);
  const userCounts = {};

  subset.forEach((event) => {
    if (!(event.user_id in userCounts)) userCounts[event.user_id] = 0;
    if (event.campaign_event_type === "TEXT_DELIVERED") userCounts[event.user_id]++;
  });

  const buckets = { 0: 0, 1: 0, 2: 0 };
  Object.values(userCounts).forEach((count) => {
    if (count === 0) buckets[0]++;
    else if (count === 1) buckets[1]++;
    else buckets[2]++;
  });

  res.json([
    { label: "0 texts",  count: buckets[0] },
    { label: "1 text",   count: buckets[1] },
    { label: "2+ texts", count: buckets[2] },
  ]);
});

// event counts grouped by campaign_name
app.get("/api/campaign-breakdown", (req, res) => {
  const breakdown = {};
  data.forEach((event) => {
    if (!breakdown[event.campaign_name]) breakdown[event.campaign_name] = {};
    const t = event.campaign_event_type;
    breakdown[event.campaign_name][t] = (breakdown[event.campaign_name][t] || 0) + 1;
  });
  const result = Object.entries(breakdown).map(([campaign, events]) => ({ campaign, ...events }));
  res.json(result);
});

// GET /api/stats?campaign=<name>
app.get("/api/stats", (req, res) => {
  const subset = filterByCampaign(req.query.campaign);
  console.log("stats subset size:", subset.length);
  const totalEvents = subset.length;
  const uniqueUsers = new Set(subset.map((d) => d.user_id)).size;
  const delivered = subset.filter((d) => d.campaign_event_type === "TEXT_DELIVERED").length;
  res.json({ totalEvents, uniqueUsers, delivered });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});