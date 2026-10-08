"use client";

// app/admin/components/pagePanel.jsx
//
// بانل صفحة من صفحات الموقع (Home / About / Services / Careers / Navbar /
// Footer) بنفس تخطيط تابات Edumaster: هيدر بعنوان الصفحة وزرّين "Refresh"
// و"Save All"، وتحته المحتوى (CollectionManager → DocEditor).

import { useState } from "react";
import { Loader, RefreshCw, Save } from "lucide-react";
import PanelFrame from "./PanelFrame";
import CollectionManager from "../CollectionManager";

export default function PagePanel({ tab, icon, title, onDirtyChange }) {
  const [controls, setControls] = useState(null);
  const busy = !!controls?.loading || !!controls?.saving;

  return (
    <PanelFrame
      icon={icon}
      title={title}
      actions={
        <>
          <button
            onClick={controls?.refresh}
            disabled={!controls || busy}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw size={18} className={controls?.loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={controls?.save}
            disabled={!controls?.canSave || busy}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            {controls?.saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
            Save All
          </button>
        </>
      }
    >
      <CollectionManager
        key={tab.id}
        tab={tab}
        collection={tab.collection}
        onDirtyChange={onDirtyChange}
        onControls={setControls}
      />
    </PanelFrame>
  );
}
