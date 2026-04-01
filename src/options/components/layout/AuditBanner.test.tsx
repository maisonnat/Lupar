// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuditBanner from '@options/components/layout/AuditBanner'

describe('AuditBanner', () => {
  it('should not render when audit mode is off', () => {
    const { container } = render(
      <AuditBanner auditModeConfig={{ auditMode: false, auditModeActivatedAt: null, auditModeActivatedBy: null }} timezone="America/Argentina/Buenos_Aires" />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render banner when audit mode is on', () => {
    render(
      <AuditBanner auditModeConfig={{ auditMode: true, auditModeActivatedAt: '2026-03-31T18:00:00.000Z', auditModeActivatedBy: 'Juan' }} timezone="America/Argentina/Buenos_Aires" />,
    )
    expect(screen.getByTestId('audit-banner')).toBeInTheDocument()
    expect(screen.getByText('MODO AUDITOR ACTIVO')).toBeInTheDocument()
  })

  it('should show activation date and user', () => {
    render(
      <AuditBanner auditModeConfig={{ auditMode: true, auditModeActivatedAt: '2026-03-31T18:00:00.000Z', auditModeActivatedBy: 'María García' }} timezone="America/Argentina/Buenos_Aires" />,
    )
    expect(screen.getByText(/María García/)).toBeInTheDocument()
    expect(screen.getByText(/Activado:/)).toBeInTheDocument()
  })

  it('should handle null activation fields gracefully', () => {
    render(
      <AuditBanner auditModeConfig={{ auditMode: true, auditModeActivatedAt: null, auditModeActivatedBy: null }} timezone="America/Argentina/Buenos_Aires" />,
    )
    expect(screen.getByTestId('audit-banner')).toBeInTheDocument()
    expect(screen.getByText('MODO AUDITOR ACTIVO')).toBeInTheDocument()
  })
})
