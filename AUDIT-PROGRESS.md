# Auditing Visits dashboard — progress

## Done
- app/lib/auditing.js (validation + dashboard/analytics computations)
- app/lib/auditDb.js (models, auth, serializers, findings sync)
- app/lib/dashboardAccess.js (AUDIT_* paths + canAccessAuditDashboard)
- app/api/audit/*: dashboard, analytics, settings, export, visits(+[id]), branches(+[id], import), findings(+[id])
- app/dashboard/_shared/ui.jsx + Charts.jsx (Modal `wide`, Delta `invert`, Gauge `stars`); mystery-shopping/components/ui.jsx + Charts.jsx now re-export them
- app/dashboard/auditing-visits: client.js, checklist.js, layout.jsx, page.jsx, i18n.js, components/AuditCharts.jsx, views/DashboardView.jsx, views/VisitsView.jsx

## Also done (this pass)
- views/FindingsView.jsx, BranchesView.jsx, AnalyticsView.jsx, ReportsView.jsx, SettingsView.jsx
- AuditDashboardSection in app/(pages)/solutions/[slug]/page.jsx now links to /dashboard/auditing-visits (AR + EN)
- i18n: added `branches.noMatch` and `reports.moreOpen` (AR + EN)

## Verified
- `npm ci`, `eslint` (audit files) and `next build` pass.
- jsdom render smoke test of the 5 new views (EN + AR) against the real computeDashboard/computeAnalytics output with a mocked fetch; request bodies checked with the real validateFinding / validateSettings.

## Not verified
- No real MongoDB run (API routes, findings sync, cascade delete, CSV export were not exercised against a database).
- No visual check in a browser (RTL layout, print/PDF output of the report).
