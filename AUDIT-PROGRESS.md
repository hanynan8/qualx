# Auditing Visits dashboard — progress

## Done
- app/lib/auditing.js (validation + dashboard/analytics computations)
- app/lib/auditDb.js (models, auth, serializers, findings sync)
- app/lib/dashboardAccess.js (AUDIT_* paths + canAccessAuditDashboard)
- app/api/audit/*: dashboard, analytics, settings, export, visits(+[id]), branches(+[id], import), findings(+[id])
- app/dashboard/_shared/ui.jsx + Charts.jsx (Modal `wide`, Delta `invert`, Gauge `stars`); mystery-shopping/components/ui.jsx + Charts.jsx now re-export them
- app/dashboard/auditing-visits: client.js, checklist.js, layout.jsx, page.jsx, i18n.js, components/AuditCharts.jsx, views/DashboardView.jsx, views/VisitsView.jsx

## Missing (page.jsx already imports them, so the build fails until they exist)
- views/FindingsView.jsx   (API ready: GET/POST /api/audit/findings, PUT/DELETE /findings/[id]; GET returns counts)
- views/BranchesView.jsx   (API ready incl. POST /branches/import)
- views/AnalyticsView.jsx  (API ready: /api/audit/analytics)
- views/ReportsView.jsx    (API ready: /api/audit/export?type=visits|findings, dashboard + analytics)
- views/SettingsView.jsx   (API ready: /api/audit/settings)
- Replace the "coming soon" AuditDashboardSection in app/(pages)/solutions/[slug]/page.jsx with a live link to /dashboard/auditing-visits (like MysteryDashboardSection)
- Not tested: no `next build` / lint run yet
