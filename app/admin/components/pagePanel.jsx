"use client";

// app/admin/components/pagePanel.jsx
//
// بانل صفحة من صفحات الموقع (Home / About / Services / Careers / Navbar /
// Footer): هيدر Edumaster + محرر الـ document (CollectionManager) اللي
// بيحفظ في /api/admin/content.

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import PanelFrame from "./PanelFrame";
import CollectionManager from "../CollectionManager";

export default function PagePanel({ tab, icon, title, onDirtyChange }) {
  return (
    <PanelFrame
      icon={icon}
      title={title}
      subtitle={tab.hint}
      actions={
        tab.href && (
          <Link
            href={tab.href}
            target="_blank"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
          >
            <ExternalLink size={18} />
            Open Page
          </Link>
        )
      }
    >
      <CollectionManager
        key={tab.id}
        tab={tab}
        collection={tab.collection}
        mode={tab.mode}
        onDirtyChange={onDirtyChange}
      />
    </PanelFrame>
  );
}
