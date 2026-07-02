import NavBar from "./NavBar.js";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">{children}</main>
    </div>
  );
}
