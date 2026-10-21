# Sign-in

The capture must sign in to the app before it records. The timeline sets the sign-in mode in
`app.login`. Claude asks you how you sign in and sets the mode.

WARNING: Always sign in with a test account that holds fake data only.
A film can show anything that the account can see.

## The three modes

| Mode | Use it when | Setting |
|---|---|---|
| None | The app is public and needs no sign-in. | `{ "type": "none" }` |
| Saved (default) | The app needs a sign-in of any type: password, Microsoft or Google sign-in (SSO), a code from your phone (MFA), a passkey. | `{ "type": "saved", "signedIn": "<selector>" }` |
| Form | The app has a plain email and password form, and you want no manual step. | `{ "type": "form", ... }` |

## Saved sign-in

You sign in by hand one time. The capture then uses that session.

1. Claude runs `pnpm login <id>`. A Chrome window opens on the app.
2. Sign in as you always do, with the test account.
3. Wait until you see the app.
4. Close the Chrome window.

The session goes to `.auth/session.json` in the film project.

WARNING: Do not share, upload or commit the `.auth` folder.
It gives access to the test account until the session expires.

Note: The `.gitignore` of the film project keeps `.auth/` out of git.

`signedIn` is a selector for an element that only a signed-in page has, for example the profile
menu. With it, the capture can tell you clearly that the session expired. Without it, the
capture records the sign-in page instead of the app.

### When the session expires

Sessions expire after some hours or days. The app decides. When the capture says "the saved
sign-in has expired", run `pnpm login <id>` again, or ask Claude to sign in again.

### More than one account

To use two accounts (for example an administrator and a normal user), give each one a name:

```json
"login": { "type": "saved", "state": "admin" }
```

The session then goes to `.auth/admin.json`.

## Form sign-in

```json
"login": {
  "type": "form",
  "url": "/login",
  "user": "input[name=email]",
  "password": "input[name=password]",
  "submit": "button[type=submit]",
  "done": "/dashboard"
}
```

| Field | Meaning | Default |
|---|---|---|
| `url` | The sign-in page. | `/` |
| `user` | The selector of the email or user name field. | `input[type="email"]` |
| `password` | The selector of the password field. | `input[type="password"]` |
| `submit` | The selector of the sign-in button. | `button[type="submit"]` |
| `done` | The page path that shows that the sign-in worked. | `app.start` |

The capture reads the email and the password from two environment variables, `FILM_USER` and
`FILM_PASSWORD`. Set them in your own terminal before you run the capture:

- Windows (PowerShell): `$env:FILM_USER = "test@example.com"; $env:FILM_PASSWORD = "..."`
- macOS: `export FILM_USER=test@example.com FILM_PASSWORD=...`

WARNING: Never write a password into a timeline, a file, a chat message or a commit.
A password in a file can leak when you share the project.

## When SSO refuses the browser

Some sign-in providers refuse a Chrome window that automation opened. They show a message like
"This browser or app may not be secure". If you see this:

1. Ask your IT team for a test account that signs in with a plain email and password.
2. Use the form sign-in with that account.

Note: Google sign-in often refuses a browser that automation opened. Other providers can
refuse it too, depending on their settings.
