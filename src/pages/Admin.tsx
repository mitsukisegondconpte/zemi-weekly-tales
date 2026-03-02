import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { BookOpen, Upload, Coins, BarChart3, Users, FileText, Plus } from "lucide-react";

const TABS = [
  { id: "novels", label: "Novèl", icon: BookOpen },
  { id: "chapters", label: "Chapit", icon: FileText },
  { id: "coins", label: "Coins / Kòd", icon: Coins },
  { id: "stats", label: "Statistik", icon: BarChart3 },
];

const MOCK_ADMIN_NOVELS = [
  { id: "1", title: "Zetwal Lannwit", chapters: 24, status: "Pibliye" },
  { id: "2", title: "Rivyè Lavi", chapters: 18, status: "Pibliye" },
  { id: "3", title: "Kòd Ansyen", chapters: 32, status: "Bouyon" },
];

const MOCK_CODES = [
  { code: "ZEMI-A3X9-KP2M", coins: 50, used: false, createdAt: "2026-02-28" },
  { code: "ZEMI-B7Y4-QR8N", coins: 120, used: true, createdAt: "2026-02-27" },
  { code: "ZEMI-C1Z6-WS5T", coins: 300, used: false, createdAt: "2026-02-26" },
];

const Admin = () => {
  const [tab, setTab] = useState("novels");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-black font-serif text-foreground mb-6">Panel Admin</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-border overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Novels tab */}
          {tab === "novels" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Tout Novèl</h2>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                  <Plus className="h-4 w-4" /> Ajoute Novèl
                </button>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Tit</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Chapit</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Estati</th>
                      <th className="text-right px-4 py-3 font-medium text-secondary-foreground">Aksyon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ADMIN_NOVELS.map((n) => (
                      <tr key={n.id} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-foreground">{n.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{n.chapters}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            n.status === "Pibliye" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                          }`}>
                            {n.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-xs text-primary hover:underline">Modifye</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chapters tab */}
          {tab === "chapters" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Upload Chapit</h2>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                  <Upload className="h-4 w-4" /> Upload
                </button>
              </div>
              <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Chwazi novèl la, ekri tit chapit la, mete kontni an, epi defini pri coins</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Novèl</label>
                    <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                      <option>Zetwal Lannwit</option>
                      <option>Rivyè Lavi</option>
                      <option>Kòd Ansyen</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Pri (Coins)</label>
                    <input type="number" placeholder="0 = gratis" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-foreground block mb-1">Tit Chapit</label>
                    <input type="text" placeholder="Tit chapit la" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coins tab */}
          {tab === "coins" && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Kòd Inik</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Kòd</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Coins</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Estati</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-foreground">Dat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CODES.map((c) => (
                      <tr key={c.code} className="border-t border-border">
                        <td className="px-4 py-3 font-mono text-foreground text-xs">{c.code}</td>
                        <td className="px-4 py-3">
                          <span className="coin-badge inline-flex items-center gap-1 text-xs">
                            <Coins className="h-3 w-3" /> {c.coins}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${c.used ? "text-muted-foreground" : "text-primary"}`}>
                            {c.used ? "Itilize" : "Disponib"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{c.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats tab */}
          {tab === "stats" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Itilizatè", value: "1,234", icon: Users },
                { label: "Chapit Li", value: "45,678", icon: BookOpen },
                { label: "Coins Itilize", value: "12,340", icon: Coins },
                { label: "Novèl Pibliye", value: "42", icon: FileText },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-6">
                  <s.icon className="h-6 w-6 text-primary mb-3" />
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
