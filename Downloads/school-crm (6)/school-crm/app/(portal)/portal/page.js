import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PORTAL_SESSION_COOKIE, verifyPortalSessionToken } from "../../../lib/portalAuth.js";

export const dynamic = "force-dynamic";

export default async function PortalLoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  const teacherId = await verifyPortalSessionToken(token);
  if (teacherId) {
    redirect("/portal/classes");
  }

  return (
    <div className="card card-pad portal-login-card">
      <h1 style={{ marginBottom: 6 }}>כניסת מורים</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 24 }}>
        הזינו את מספר תעודת הזהות שלכם כדי להיכנס
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form action="/api/portal/login" method="post">
        <div className="field">
          <label htmlFor="tz">תעודת זהות</label>
          <input
            id="tz"
            name="tz"
            type="text"
            inputMode="numeric"
            autoFocus
            required
            placeholder="9 ספרות"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          כניסה
        </button>
      </form>
    </div>
  );
}
