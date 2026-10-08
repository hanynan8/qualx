"use client";

// app/admin/AdminDashboard.jsx
//
// لوحة الأدمن بنفس شكل ومنطق أدمن Edumaster: هيدر بتدرّج أزرق/بنفسجي، سايدبار
// بمجموعات قابلة للطي، وبانل لكل قسم. الفحص الأمني بيحصل على السيرفر في
// page.jsx (getServerSession) وكل العمليات بتمر على /api/admin/* المحمية.
//
// الحفاظ على منطق qualx: تحذير التعديلات غير المحفوظة قبل التنقل/الإغلاق،
// وحفظ القسم النشط في الـ hash (#services).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Database, Settings, Home, Navigation, Info, Layers, Briefcase, PanelBottom, Users,
  FileText, ChevronDown, ArrowLeft, Loader,
} from "lucide-react";

import { TABS } from "./tabsConfig";
import { api } from "./adminUtils";
import AccountCard from "./components/accountCard";
import PagePanel from "./components/pagePanel";
import UsersPanel from "./components/usersPanel";

// عناصر السايدبار. tabId = بانل صفحة بيتبني من TABS (tabsConfig.js)؛ component
// = بانل مخصص بيستقبل { user, mfaEnabled, onDirtyChange }.
const SIDEBAR_GROUPS = [
  {
    id: "pages",
    type: "group",
    name: "Pages",
    icon: FileText,
    items: [
      { id: "home", name: "Home", icon: Home, tabId: "home" },
      { id: "about", name: "About", icon: Info, tabId: "about" },
      { id: "services", name: "Services", icon: Layers, tabId: "services" },
      { id: "careers", name: "Careers", icon: Briefcase, tabId: "careers" },
      { id: "navbar", name: "Navbar", icon: Navigation, tabId: "navbar" },
      { id: "footer", name: "Footer", icon: PanelBottom, tabId: "footer" },
    ],
  },
  {
    id: "management",
    type: "group",
    name: "Management",
    icon: Users,
    items: [
      { id: "users", name: "Users", icon: Users, component: UsersPanel },
    ],
  },
];

const FLAT_TABS = SIDEBAR_GROUPS.flatMap((g) => (g.type === "single" ? [g] : g.items));

function findGroupIdForTab(tabId) {
  const group = SIDEBAR_GROUPS.find((g) => g.type === "group" && g.items.some((i) => i.id === tabId));
  return group?.id || null;
}

export default function AdminDashboard({ user, mfaEnabled }) {
  const [activeTab, setActiveTab] = useState("home");
  const [openGroups, setOpenGroups] = useState({ pages: true });
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  const onDirtyChange = useCallback((v) => {
    dirtyRef.current = v;
    setDirty(v);
  }, []);

  // القسم النشط بيتحفظ في الـ hash عشان refresh / لينك مباشر.
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "");
    if (FLAT_TABS.some((t) => t.id === fromHash)) {
      setActiveTab(fromHash);
      const gid = findGroupIdForTab(fromHash);
      if (gid) setOpenGroups((prev) => ({ ...prev, [gid]: true }));
    }
  }, []);

  // تحذير قبل ما المتصفح يقفل/يعمل refresh والفيه تعديلات غير محفوظة.
  useEffect(() => {
    const handler = (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  function toggleGroup(groupId) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function selectTab(tabId) {
    if (tabId === activeTab) return;
    if (dirtyRef.current && !window.confirm("فيه تعديلات غير محفوظة في القسم ده. تسيبها وتروح لقسم تاني؟")) return;
    onDirtyChange(false);
    setActiveTab(tabId);
    const groupId = findGroupIdForTab(tabId);
    if (groupId) setOpenGroups((prev) => ({ ...prev, [groupId]: true }));
    try {
      window.history.replaceState(null, "", `#${tabId}`);
    } catch {
      /* مش مشكلة */
    }
  }

  // تصدير كل بيانات الموقع (من غير auth/audit_logs المحميين) كملف JSON.
  async function handleExportAllData() {
    setExporting(true);
    try {
      const list = await api("/api/admin/content");
      const names = (list.collections || []).filter((c) => !c.protected).map((c) => c.name);
      const result = {};
      await Promise.all(
        names.map(async (name) => {
          try {
            const data = await api(`/api/admin/content?collection=${encodeURIComponent(name)}`);
            result[name] = data.docs || [];
          } catch {
            result[name] = { error: "Failed to fetch" };
          }
        })
      );
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `site-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(`فشل التصدير: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  const activeItem = FLAT_TABS.find((t) => t.id === activeTab) || FLAT_TABS[0];

  function renderActive() {
    if (activeItem.tabId) {
      const tab = TABS.find((t) => t.id === activeItem.tabId);
      return <PagePanel tab={tab} icon={activeItem.icon} title={activeItem.name} onDirtyChange={onDirtyChange} />;
    }
    const Panel = activeItem.component;
    return <Panel key={activeItem.id} user={user} mfaEnabled={mfaEnabled} onDirtyChange={onDirtyChange} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="ltr">
      <div className="shadow-lg bg-gradient-to-r from-blue-700 to-purple-700 border-b-4 border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5 flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <Link href="/" title="الرجوع للموقع" className="text-white/70 hover:text-white w-fit">
                <ArrowLeft size={32} strokeWidth={1.25} />
              </Link>
              <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
                <Database size={30} className="animate-pulse" />
                Qualx Admin Panel
                {dirty && <span aria-label="تعديلات غير محفوظة" className="h-2.5 w-2.5 rounded-full bg-amber-400" />}
              </h1>
            </div>
            <button
              onClick={handleExportAllData}
              disabled={exporting}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl border border-white/30"
            >
              {exporting ? <Loader size={18} className="animate-spin" /> : <Database size={18} />}
              {exporting ? "Exporting..." : "Export All Site Data (JSON)"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-2 sm:px-3 lg:px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <div className="lg:col-span-1">
            <AccountCard user={user} mfaEnabled={mfaEnabled} />

            <div className="bg-white rounded-2xl shadow-xl p-5 sticky top-4 border border-gray-200">
              <h2 className="text-lg font-semibold mb-5 pb-3 border-b flex items-center gap-2 text-gray-700">
                <Settings size={20} className="text-blue-500" />
                Sections
              </h2>
              <div className="space-y-2">
                {SIDEBAR_GROUPS.map((group) => {
                  if (group.type === "single") {
                    const Icon = group.icon;
                    const isActive = activeTab === group.id;
                    return (
                      <button
                        key={group.id}
                        onClick={() => selectTab(group.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md scale-[1.02]"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{group.name}</span>
                      </button>
                    );
                  }

                  const GroupIcon = group.icon;
                  const isOpen = !!openGroups[group.id];
                  const hasActiveChild = group.items.some((i) => i.id === activeTab);

                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left font-medium ${
                          hasActiveChild ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <GroupIcon size={18} />
                          <span>{group.name}</span>
                        </span>
                        <ChevronDown size={16} className={`shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isOpen && (
                        <div className="mt-1 ms-3 ps-3 border-l-2 border-gray-100 space-y-1">
                          {group.items.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => selectTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium ${
                                  isActive
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                              >
                                <Icon size={16} />
                                <span>{tab.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 min-w-0">{renderActive()}</div>
        </div>
      </div>
    </div>
  );
}
