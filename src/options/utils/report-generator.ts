import type { DiscoveryRecord } from '@shared/types/discovery'
import type { AppSettings, AuditModeConfig, AdminRole } from '@shared/types/storage'
import type { RiskLevel } from '@shared/types/domain'
import type { ComplianceMapResult, ComplianceGap } from '@options/utils/compliance-mapper'
import { mapCompliance } from '@options/utils/compliance-mapper'
import { calculateRiskScore } from '@options/utils/risk-calculator'
import { RISK_LEVEL_LABELS, DISCOVERY_STATUS_LABELS } from '@shared/constants/risk-levels'
import { CATEGORY_LABELS } from '@shared/constants/categories'
import { AUDIT_FIELD_LABELS } from '@options/utils/audit-trail'
import { formatDateLong, detectTimezone } from '@shared/utils/date-utils'

const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  compliance_officer: 'Oficial de Compliance',
  it_admin: 'Administrador IT',
  auditor: 'Auditor',
  executive: 'Ejecutivo',
}

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.6; background: #f9fafb; }
  .page { max-width: 210mm; margin: 0 auto; background: white; }
  .cover { padding: 80px 60px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
  .cover h1 { font-size: 32px; margin-bottom: 8px; }
  .cover h2 { font-size: 18px; font-weight: 400; opacity: 0.9; margin-bottom: 40px; }
  .cover .meta { font-size: 14px; opacity: 0.8; line-height: 2; }
  .cover .disclaimer { margin-top: 60px; font-size: 11px; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 16px; }
  .section { padding: 40px 60px; border-bottom: 1px solid #e5e7eb; }
  .section-title { font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 24px; padding-bottom: 8px; border-bottom: 2px solid #3b82f6; }
  .risk-gauge { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
  .risk-score { font-size: 48px; font-weight: 800; }
  .risk-bar { flex: 1; height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; }
  .risk-fill { height: 100%; border-radius: 6px; transition: width 0.3s; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .card-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .card-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
  tr:hover { background: #f9fafb; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
  .badge-prohibited { background: #fee2e2; color: #991b1b; }
  .badge-high { background: #ffedd5; color: #9a3412; }
  .badge-limited { background: #fef9c3; color: #854d0e; }
  .badge-minimal { background: #dcfce7; color: #166534; }
  .badge-detected { background: #fef9c3; color: #854d0e; }
  .badge-confirmed { background: #dbeafe; color: #1e40af; }
  .badge-dismissed { background: #f3f4f6; color: #6b7280; }
  .badge-authorized { background: #dcfce7; color: #166534; }
  .badge-complete { background: #dcfce7; color: #166534; }
  .badge-pending { background: #fef9c3; color: #854d0e; }
  .badge-overdue { background: #fee2e2; color: #991b1b; }
  .badge-not_applicable { background: #f3f4f6; color: #6b7280; }
  .gap-action { font-size: 12px; color: #374151; }
  .gap-action.urgent { color: #991b1b; font-weight: 600; }
  .recommendation { padding: 16px; margin-bottom: 12px; border-radius: 8px; border-left: 4px solid; }
  .rec-critical { background: #fee2e2; border-color: #ef4444; }
  .rec-high { background: #ffedd5; border-color: #f97316; }
  .rec-moderate { background: #fef9c3; border-color: #eab308; }
  .rec-title { font-weight: 600; margin-bottom: 4px; }
  .rec-detail { font-size: 13px; color: #4b5563; }
  .reg-progress { margin-bottom: 20px; }
  .reg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .reg-name { font-weight: 600; }
  .reg-pct { font-size: 14px; color: #6b7280; }
  .footer { padding: 24px 60px; text-align: center; font-size: 11px; color: #9ca3af; }
  @media print { body { background: white; } .page { max-width: none; } .section { break-inside: avoid; } }
`

function badgeClass(value: string): string {
  return `badge badge-${value}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function generateCover(
  settings: AppSettings,
  toolCount: number,
  date: string,
  timezone: string,
): string {
  const company = escapeHtml(settings.companyName || 'Organización no configurada')
  const responsible = escapeHtml(settings.responsiblePerson || 'No asignado')

  const profile = settings.adminProfile
  const hasAdminProfile = profile && (profile.adminName || profile.adminEmail)
  const adminName = hasAdminProfile ? escapeHtml(profile.adminName) : ''
  const adminEmail = hasAdminProfile ? escapeHtml(profile.adminEmail) : ''
  const adminRole = hasAdminProfile && profile.adminRole
    ? escapeHtml(ADMIN_ROLE_LABELS[profile.adminRole])
    : ''
  const adminDept = hasAdminProfile ? escapeHtml(profile.department) : ''

  const adminInfoLines = hasAdminProfile
    ? `<div><strong>Responsable:</strong> ${adminName}${adminRole ? ` (${adminRole})` : ''}</div>
       ${adminEmail ? `<div><strong>Email:</strong> ${adminEmail}</div>` : ''}
       ${adminDept ? `<div><strong>Departamento:</strong> ${adminDept}</div>` : ''}`
    : `<div><strong>Responsable:</strong> ${responsible}</div>`

  return `
    <div class="cover">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:24px;opacity:0.9">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
      <h1>Reporte de Cumplimiento IA</h1>
      <h2>Análisis de Herramientas de Inteligencia Artificial</h2>
      <div class="meta">
        <div><strong>Organización:</strong> ${company}</div>
        ${adminInfoLines}
        <div><strong>Fecha:</strong> ${formatDateLong(date, timezone)}</div>
        <div><strong>Herramientas analizadas:</strong> ${toolCount}</div>
        <div><strong>Versión del reporte:</strong> 1.0</div>
      </div>
      <div class="disclaimer">
        Este reporte fue generado automáticamente por AI Compliance Tracker. La información contenida es orientativa y no constituye asesoramiento legal. Consulte con un profesional para validación formal.
      </div>
    </div>`
}

function generateExecutiveSummary(
  discoveries: DiscoveryRecord[],
  riskScore: ReturnType<typeof calculateRiskScore>,
  compliance: ComplianceMapResult,
): string {
  const highRisk = discoveries.filter((d) => {
    const r = d.userRiskLevel ?? d.defaultRiskLevel
    return r === 'high' || r === 'prohibited'
  }).length
  const pending = discoveries.filter((d) => d.status === 'detected').length

  const riskColor = riskScore.color
  const riskFillWidth = riskScore.score

  const categoryBreakdown = Object.entries(
    discoveries.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([cat, count]) => `<tr><td>${CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}</td><td>${count}</td></tr>`)
    .join('')

  return `
    <div class="section">
      <h2 class="section-title">Resumen Ejecutivo</h2>
      <div class="risk-gauge">
        <div class="risk-score" style="color:${riskColor}">${riskScore.score}</div>
        <div>
          <div style="font-size:14px;color:#6b7280">Risk Score — ${riskScore.label}</div>
          <div class="risk-bar" style="width:300px">
            <div class="risk-fill" style="width:${riskFillWidth}%;background:${riskColor}"></div>
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-label">Total herramientas</div>
          <div class="card-value">${discoveries.length}</div>
        </div>
        <div class="card">
          <div class="card-label">Alto riesgo / Prohibidas</div>
          <div class="card-value" style="color:#f97316">${highRisk}</div>
        </div>
        <div class="card">
          <div class="card-label">Pendientes de revisión</div>
          <div class="card-value" style="color:#eab308">${pending}</div>
        </div>
        <div class="card">
          <div class="card-label">Brechas detectadas</div>
          <div class="card-value" style="color:#ef4444">${compliance.totalGaps}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Categoría</th><th>Cantidad</th></tr></thead>
        <tbody>${categoryBreakdown}</tbody>
      </table>
    </div>`
}

function generateInventoryTable(discoveries: DiscoveryRecord[], timezone: string): string {
  const rows = discoveries
    .map((d) => {
      const risk: RiskLevel = d.userRiskLevel ?? d.defaultRiskLevel
      return `<tr>
        <td><strong>${escapeHtml(d.toolName)}</strong><br><span style="font-size:11px;color:#6b7280">${escapeHtml(d.domain)}</span></td>
        <td>${CATEGORY_LABELS[d.category]}</td>
        <td><span class="${badgeClass(risk)}">${RISK_LEVEL_LABELS[risk]}</span></td>
        <td><span class="${badgeClass(d.status)}">${DISCOVERY_STATUS_LABELS[d.status]}</span></td>
        <td>${d.visitCount}</td>
        <td>${formatDateLong(d.lastSeen, timezone)}</td>
      </tr>`
    })
    .join('')

  return `
    <div class="section">
      <h2 class="section-title">Inventario de Herramientas IA</h2>
      <table>
        <thead>
          <tr>
            <th>Herramienta</th>
            <th>Categoría</th>
            <th>Riesgo</th>
            <th>Estado</th>
            <th>Visitas</th>
            <th>Última visita</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

function generateComplianceMap(compliance: ComplianceMapResult): string {
  const progressBars = compliance.summaries
    .map((s) => {
      const barColor = s.percentComplete >= 75 ? '#22c55e' : s.percentComplete >= 50 ? '#eab308' : '#ef4444'
      return `
        <div class="reg-progress">
          <div class="reg-header">
            <span class="reg-name">${s.regulationName}</span>
            <span class="reg-pct">${s.percentComplete}% completo · ${s.gaps.length} brecha${s.gaps.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="risk-bar">
            <div class="risk-fill" style="width:${s.percentComplete}%;background:${barColor}"></div>
          </div>
        </div>`
    })
    .join('')

  const gapRows = compliance.allGaps.length > 0
    ? compliance.allGaps
        .slice(0, 50)
        .map((g: ComplianceGap) => {
          const actionClass = g.assessment === 'overdue' ? 'gap-action urgent' : 'gap-action'
          return `<tr>
            <td>${g.regulationName}</td>
            <td>${escapeHtml(g.articleTitle)}</td>
            <td><span class="${badgeClass(g.assessment)}">${g.assessment}</span></td>
            <td>${escapeHtml(g.toolName)}</td>
            <td class="${actionClass}">${escapeHtml(g.action)}</td>
          </tr>`
        })
        .join('')
    : '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:24px">No se detectaron brechas de cumplimiento.</td></tr>'

  return `
    <div class="section">
      <h2 class="section-title">Mapa de Cumplimiento</h2>
      ${progressBars}
      <table>
        <thead>
          <tr>
            <th>Regulación</th>
            <th>Requisito</th>
            <th>Estado</th>
            <th>Herramienta</th>
            <th>Acción sugerida</th>
          </tr>
        </thead>
        <tbody>${gapRows}</tbody>
      </table>
    </div>`
}

function generateRecommendations(compliance: ComplianceMapResult): string {
  if (compliance.allGaps.length === 0) {
    return `
      <div class="section">
        <h2 class="section-title">Recomendaciones</h2>
        <div class="card" style="text-align:center;padding:32px">
          <p style="font-size:16px;color:#22c55e;font-weight:600">✓ Todas las herramientas están en cumplimiento</p>
          <p style="font-size:13px;color:#6b7280;margin-top:8px">Continúe con el monitoreo rutinario.</p>
        </div>
      </div>`
  }

  const seen = new Set<string>()
  const recs: { title: string; detail: string; severity: string }[] = []

  for (const gap of compliance.allGaps) {
    const key = `${gap.regulationId}-${gap.articleId}-${gap.toolName}`
    if (seen.has(key)) continue
    seen.add(key)

    const severity =
      gap.assessment === 'overdue'
        ? 'critical'
        : gap.riskLevel === 'high' || gap.riskLevel === 'prohibited'
          ? 'high'
          : 'moderate'

    recs.push({
      title: `${gap.toolName}: ${gap.articleTitle} (${gap.regulationName})`,
      detail: gap.action || `Evaluar cumplimiento de "${gap.articleTitle}" para ${gap.toolName}.`,
      severity,
    })

    if (recs.length >= 15) break
  }

  const recsHtml = recs
    .map((r) => {
      const cssClass = `rec-${r.severity}`
      return `
        <div class="recommendation ${cssClass}">
          <div class="rec-title">${escapeHtml(r.title)}</div>
          <div class="rec-detail">${escapeHtml(r.detail)}</div>
        </div>`
    })
    .join('')

  return `
    <div class="section">
      <h2 class="section-title">Recomendaciones Prioritarias</h2>
      ${recsHtml}
    </div>`
}

export async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateAuditBadge(auditModeConfig: AuditModeConfig, contentHash: string, timezone: string): string {
  if (!auditModeConfig.auditMode) return ''

  const activatedAt = auditModeConfig.auditModeActivatedAt
    ? formatDateLong(auditModeConfig.auditModeActivatedAt, timezone)
    : 'No disponible'

  const activatedBy = auditModeConfig.auditModeActivatedBy || 'No especificado'

  return `
    <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:20px;margin:0 60px 20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        <span style="font-size:16px;font-weight:700;color:#92400e">MODO AUDITOR — DATOS EN SOLO LECTURA</span>
      </div>
      <div style="font-size:13px;color:#92400e;line-height:1.8">
        <div><strong>Activado por:</strong> ${escapeHtml(activatedBy)}</div>
        <div><strong>Fecha de activación:</strong> ${activatedAt}</div>
        <div style="margin-top:8px">
          <strong>Hash de integridad (SHA-256):</strong><br>
          <code style="font-size:11px;background:#fffbeb;padding:4px 8px;border-radius:4px;word-break:break-all;display:inline-block;margin-top:4px">${contentHash}</code>
        </div>
      </div>
    </div>`
}

function generateAuditTrailSection(discoveries: DiscoveryRecord[], timezone: string): string {
  const toolsWithTrail = discoveries.filter((d) => d.auditTrail.length > 0)

  if (toolsWithTrail.length === 0) return ''

  const toolSections = toolsWithTrail.map((d) => {
    const sortedTrail = [...d.auditTrail].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    const recentTrail = sortedTrail.slice(0, 20)

    const rows = recentTrail
      .map((entry) => `<tr>
        <td style="white-space:nowrap">${formatDateLong(entry.timestamp, timezone)}</td>
        <td><span class="badge badge-detected">${escapeHtml(AUDIT_FIELD_LABELS[entry.field])}</span></td>
        <td>${escapeHtml(entry.oldValue)}</td>
        <td>${escapeHtml(entry.newValue)}</td>
      </tr>`)
      .join('')

    return `
      <div style="margin-bottom:24px">
        <h3 style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px">${escapeHtml(d.toolName)}</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Campo</th>
              <th>Valor anterior</th>
              <th>Valor nuevo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }).join('')

  return `
    <div class="section">
      <h2 class="section-title">Historial de Cambios (Audit Trail)</h2>
      ${toolSections}
    </div>`
}

export function generateReport(
  discoveries: DiscoveryRecord[],
  settings: AppSettings,
): string {
  const now = new Date().toISOString()
  const timezone = settings.timezone ?? detectTimezone()
  const riskScore = calculateRiskScore(discoveries)
  const compliance = mapCompliance(discoveries)
  const isAuditMode = settings.auditModeConfig?.auditMode ?? false

  const auditPlaceholder = isAuditMode
    ? '<div id="audit-badge-placeholder" data-audit-mode="true"></div>'
    : ''

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Cumplimiento IA — ${formatDateLong(now, timezone)}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="page">
    ${generateCover(settings, discoveries.length, now, timezone)}
    ${auditPlaceholder}
    ${generateExecutiveSummary(discoveries, riskScore, compliance)}
    ${generateInventoryTable(discoveries, timezone)}
    ${generateComplianceMap(compliance)}
    ${generateRecommendations(compliance)}
    ${generateAuditTrailSection(discoveries, timezone)}
    <div class="footer">
      Generado por AI Compliance Tracker el ${formatDateLong(now, timezone)} · Reporte autocontenido — funciona offline
    </div>
  </div>
</body>
</html>`

  return html
}

export async function generateReportWithHash(
  discoveries: DiscoveryRecord[],
  settings: AppSettings,
): Promise<string> {
  const html = generateReport(discoveries, settings)
  const isAuditMode = settings.auditModeConfig?.auditMode ?? false

  if (!isAuditMode) return html

  const contentHash = await generateContentHash(html)
  const auditBadge = generateAuditBadge(
    settings.auditModeConfig,
    contentHash,
    settings.timezone ?? detectTimezone(),
  )

  return html.replace(
    '<div id="audit-badge-placeholder" data-audit-mode="true"></div>',
    auditBadge,
  )
}

export function downloadReport(html: string, date?: Date): void {
  const d = date ?? new Date()
  const filename = `ai-compliance-report-${d.toISOString().split('T')[0]}.html`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
