const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials":
    "E-Mail oder Passwort ist falsch. Bitte erneut versuchen.",
  "Invalid email or password":
    "E-Mail oder Passwort ist falsch. Bitte erneut versuchen.",
  "Email not confirmed":
    "Bitte bestätige zuerst deine E-Mail-Adresse, bevor du dich anmeldest.",
  "User already registered":
    "Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.",
  "Password should be at least 6 characters":
    "Das Passwort muss mindestens 6 Zeichen lang sein.",
  "Signup requires a valid password":
    "Bitte gib ein gültiges Passwort ein.",
  "Unable to validate email address: invalid format":
    "Bitte gib eine gültige E-Mail-Adresse ein.",
  "Email rate limit exceeded":
    "Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.",
  "For security purposes, you can only request this once every 60 seconds":
    "Aus Sicherheitsgründen kannst du das erst in 60 Sekunden erneut versuchen.",
  "User not found": "Kein Konto mit dieser E-Mail-Adresse gefunden.",
  "Signups not allowed for this instance":
    "Registrierungen sind derzeit nicht möglich.",
  "Database error saving new user":
    "Konto konnte nicht erstellt werden. Bitte später erneut versuchen.",
  "Auth session missing!":
    "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
  "OAuth provider not enabled":
    "Google-Anmeldung ist nicht konfiguriert. Bitte später erneut versuchen.",
  "Provider not enabled":
    "Google-Anmeldung ist nicht konfiguriert. Bitte später erneut versuchen.",
  "Unsupported provider":
    "Dieser Anmeldeanbieter wird nicht unterstützt.",
};

export function getAuthErrorMessage(error: { message: string }): string {
  return AUTH_ERROR_MESSAGES[error.message] ?? error.message;
}
