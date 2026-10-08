"use client";

// app/admin/components/collectionsPanel.jsx
//
// مستكشف أي كولكشن تاني في الداتابيز (غير اللي ليها تاب مخصص): اختيار كولكشن
// موجود أو بدء كولكشن جديد، وتعديل documents بنفس المحرر العام.

import { useEffect, useState } from "react";
import { Database, Plus } from "lucide-react";
import PanelFrame, { Banner, Spinner } from "./PanelFrame";
import CollectionManager from "../CollectionManager";
import { api } from "../adminUtils";
import { DEDICATED_COLLECTIONS } from "../tabsConfig";

const COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export default function CollectionsPanel({ onDirtyChange }) {
  const [collections, setCollections] = useState(null);
  const [selected, setSelected] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/admin/content")
      .then((data) => {
        if (cancelled) return;
        const others = data.collections.filter((c) => !DEDICATED_COLLECTIONS.has(c.name));
        setCollections(others);
        setSelected((cur) => cur || others[0]?.name || "");
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  function startNew() {
    const name = newName.trim();
    if (!COLLECTION_NAME_REGEX.test(name)) return setError("اسم الكولكشن: حروف إنجليزي/أرقام/شرطة فقط (حتى 64)");
    if (name === "auth" || name === "audit_logs") return setError("الكولكشن ده محمي");
    setError("");
    setCollections((prev) => (prev.some((c) => c.name === name) ? prev : [...prev, { name, count: 0 }]));
    setSelected(name);
    setNewName("");
  }

  return (
    <PanelFrame icon={Database} title="Other Collections" subtitle="أي كولكشن تاني في الداتابيز">
      {!collections && !error ? (
        <Spinner />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <select value={selected} onChange={(e) => setSelected(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-xl bg-white" dir="ltr">
              {(collections || []).length === 0 && <option value="">(مفيش كولكشنز تانية)</option>}
              {(collections || []).map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
            <span className="hidden h-8 w-px bg-gray-200 sm:block" />
            <input
              dir="ltr"
              placeholder="New collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startNew()}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 outline-none"
            />
            <button type="button" onClick={startNew} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition">
              <Plus size={16} /> New Collection
            </button>
          </div>
          {error && <Banner type="error">{error}</Banner>}
          {selected && <CollectionManager key={selected} collection={selected} mode="list" tab={{}} onDirtyChange={onDirtyChange} />}
        </>
      )}
    </PanelFrame>
  );
}
