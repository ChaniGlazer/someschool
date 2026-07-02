export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="login-shell">
      <div className="login-card card card-pad">
        <div className="login-mark" aria-hidden="true">
          י
        </div>
        <h1>מערכת היועץ החינוכי</h1>
        <p>התחברות לאזור האישי</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form action="/api/auth/login" method="post">
          <div className="field">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            התחברות
          </button>
        </form>
      </div>
    </div>
  );
}
