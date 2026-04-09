import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const BASE_URL = "http://localhost:5000";
const COLORS = ["#e63946", "#2a9d8f", "#e9c46a", "#457b9d", "#f4a261"];

function StatCard({ title, value, sub, accent }) {
  return (
    <div className="stat-card">
      <p className="stat-title">{title}</p>
      <p className="stat-value" style={accent ? { color: accent } : {}}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="chart-card">
      <h2 className="chart-title">{title}</h2>
      {sub && <p className="chart-sub">{sub}</p>}
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, padding: "10px 14px" }}>
      {label && <p style={{ color: "#888", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 13 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: "#fff", fontWeight: 600 }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Page ────────────────────────────────────────────────────────────

function OverviewPage() {
  const [eventCounts, setEventCounts] = useState([]);
  const [textDelivered, setTextDelivered] = useState([]);
  const [campaignBreakdown, setCampaignBreakdown] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [e, t, b, s] = await Promise.all([
        fetch(`${BASE_URL}/api/event-counts`).then((r) => r.json()),
        fetch(`${BASE_URL}/api/text-delivered`).then((r) => r.json()),
        fetch(`${BASE_URL}/api/campaign-breakdown`).then((r) => r.json()),
        fetch(`${BASE_URL}/api/stats`).then((r) => r.json()),
      ]);
      setEventCounts(e);
      setTextDelivered(t);
      setCampaignBreakdown(b);
      setStats(s);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="status-msg">Loading overview...</div>;

  return (
    <div className="dashboard">
      <div className="stats-row">
        <StatCard title="Total Events"    value={stats.totalEvents.toLocaleString()}  sub="all campaigns" />
        <StatCard title="Unique Users"    value={stats.uniqueUsers.toLocaleString()}  sub="targeted users" />
        <StatCard title="Texts Delivered" value={stats.delivered.toLocaleString()}    sub="TEXT_DELIVERED" accent="#2a9d8f" />
      </div>

      <ChartCard title="Event Type Distribution" sub="Count of each event type across all campaigns">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eventCounts} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="type" tick={{ fill: "#aaa", fontSize: 11 }} />
            <YAxis tick={{ fill: "#aaa", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
              {eventCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="chart-row">
        <ChartCard title="TEXT_DELIVERED per User" sub="Users grouped by texts received (0, 1, 2+)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={textDelivered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="label" tick={{ fill: "#aaa", fontSize: 12 }} />
              <YAxis tick={{ fill: "#aaa", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Users" fill="#2a9d8f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Event Share" sub="Percentage of each event type">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={eventCounts} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={85} paddingAngle={3}>
                {eventCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ color: "#aaa", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      
    </div>
  );
}

// ─── Campaign Detail Page ─────────────────────────────────────────────────────

function CampaignPage({ campaign_name }) {
  const [eventCounts, setEventCounts] = useState([]);
  const [textDelivered, setTextDelivered] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    setLoading(true);
    setEventCounts([]);
    setTextDelivered([]);
    setStats(null);

    async function load() {
      const encoded = encodeURIComponent(campaign_name);

      console.log("--- CampaignPage Debug ---");
      console.log("campaign_name:", campaign_name);
      console.log("encoded:", encoded);
      console.log("Fetching:", `${BASE_URL}/api/event-counts?campaign=${encoded}`);

      try {
        const [e, t, s] = await Promise.all([
          fetch(`${BASE_URL}/api/event-counts?campaign=${encoded}`).then((r) => r.json()),
          fetch(`${BASE_URL}/api/text-delivered?campaign=${encoded}`).then((r) => r.json()),
          fetch(`${BASE_URL}/api/stats?campaign=${encoded}`).then((r) => r.json()),
        ]);

        console.log("event-counts response:", e);
        console.log("text-delivered response:", t);
        console.log("stats response:", s);

        setDebugInfo({ eventCount: e.length, totalEvents: s.totalEvents });
        setEventCounts(e);
        setTextDelivered(t);
        setStats(s);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign_name]);

  if (loading) return <div className="status-msg">Loading {campaign_name}...</div>;

  // If stats loaded but totalEvents is 0, the campaign name didn't match anything
  if (stats && stats.totalEvents === 0) {
    return (
      <div className="dashboard">
        <div className="campaign-hero">
          <span className="campaign-badge">Campaign</span>
          <h2 className="campaign-name">{campaign_name}</h2>
        </div>
        <div className="status-msg error">
          No data found for "{campaign_name}". <br />
          Check your browser console (F12) — the debug logs will show exactly what name is being sent to the backend.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="campaign-hero">
        <span className="campaign-badge">Campaign</span>
        <h2 className="campaign-name">{campaign_name}</h2>
      </div>

      <div className="stats-row">
        <StatCard title="Total Events"    value={stats.totalEvents.toLocaleString()} sub="in this campaign" />
        <StatCard title="Unique Users"    value={stats.uniqueUsers.toLocaleString()} sub="targeted users" />
        <StatCard title="Texts Delivered" value={stats.delivered.toLocaleString()}   sub="TEXT_DELIVERED" accent="#2a9d8f" />
      </div>

      <ChartCard title="Event Type Distribution" sub={`Count of each event type in ${campaign_name}`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eventCounts} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="type" tick={{ fill: "#aaa", fontSize: 11 }} />
            <YAxis tick={{ fill: "#aaa", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
              {eventCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="chart-row">
        <ChartCard title="TEXT_DELIVERED per User" sub="Users grouped by texts received (0, 1, 2+)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={textDelivered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="label" tick={{ fill: "#aaa", fontSize: 12 }} />
              <YAxis tick={{ fill: "#aaa", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Users" fill="#2a9d8f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Event Share" sub="Percentage of each event type">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={eventCounts} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={85} paddingAngle={3}>
                {eventCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ color: "#aaa", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Event Summary Table" sub="All event types with counts and percentages">
        <div style={{ overflowX: "auto" }}>
          <table className="event-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Count</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {[...eventCounts].sort((a, b) => b.count - a.count).map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className="event-dot" style={{ background: COLORS[i % COLORS.length] }} />
                    {row.type}
                  </td>
                  <td>{row.count.toLocaleString()}</td>
                  <td>{((row.count / stats.totalEvents) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Root Dashboard with Tabs ─────────────────────────────────────────────────

function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/campaigns`)
      .then((r) => r.json())
      .then((data) => {
        console.log("Campaigns loaded:", data);
        setCampaigns(data);
      })
      .catch(() => setError("Could not connect to backend. Make sure server.js is running on port 5000."));
  }, []);

  if (error) return <div className="status-msg error">{error}</div>;

  const tabs = [
    { id: "overview", label: "Overview" },
    ...campaigns.map((c) => ({ id: c, label: c })),
  ];

  return (
    <div>
      <div className="tab-bar">
        <div className="tab-bar-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview"
        ? <OverviewPage />
        : <CampaignPage key={activeTab} campaign_name={activeTab} />
      }
    </div>
  );
}

export default Dashboard;