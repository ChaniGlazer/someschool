export default function PortalLayout({ children }) {
  return (
    <div className="portal-shell">
      <header className="portal-header">
        <span className="portal-header-mark" aria-hidden="true">
          י
        </span>
        <span>פורטל מורים - מיפוי תלמידים</span>
      </header>
      <main className="portal-main">{children}</main>
    </div>
  );
}
