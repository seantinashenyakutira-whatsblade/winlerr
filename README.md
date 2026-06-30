# Winlerr — Automate. Optimize. Grow.

Winlerr is a business growth platform that helps Southern African businesses manage websites, social media, client engagement, content planning, and automation from one place.

This repo contains the early-access landing page with a Supabase-powered lead generation system and admin dashboard.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/winlerr.git
cd winlerr
```

No build step required — this is a vanilla HTML/CSS/JS project. Open `index.html` in a browser or serve with any static server:

```bash
npx serve .
# or
python -m http.server 3000
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema in `sql/schema.sql`
3. Run the policies in `sql/policies.sql`
4. Go to **Project Settings → API** and copy your URL and anon key

### 3. Configure Environment

Open `index.html` and `admin.html`, find the `window.__SUPABASE_CONFIG` block near the top, and replace the placeholder values:

```js
window.__SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key',
}
```

For production, use a build process or server-side injection to set these securely. Do **not** hardcode production keys in committed files.

### 4. Create the First Admin User

1. In Supabase **Authentication → Users**, create a new user with email/password
2. Copy the new user's UUID from the Auth Users table
3. Run this SQL in Supabase SQL Editor:

```sql
insert into public.admin_profiles (id, full_name, role)
values ('REPLACE_WITH_AUTH_USER_ID', 'Your Name', 'admin');
```

4. Go to `admin.html`, log in with the email/password you created

### 5. Set Up Resend (Email)

1. Create an account at [resend.com](https://resend.com)
2. Create an API key
3. Verify a domain for sending
4. The landing page calls Resend via a thin API proxy — you'll need a small server-side endpoint at `/api/resend` (see `api/resend.js`)

For testing without Resend, forms will still save to Supabase and fall back to localStorage.

## Project Structure

```
winlerr/
├── index.html            # Landing page
├── admin.html            # Admin login + dashboard
├── styles.css            # Landing page styles
├── admin.css             # Admin dashboard styles
├── script.js             # Landing page form handling + animations
├── admin.js              # Admin dashboard logic
├── supabaseClient.js     # Supabase client + data functions
├── api/
│   └── resend.js         # Resend email helpers (server-side)
├── sql/
│   ├── schema.sql        # Database tables
│   └── policies.sql      # Row Level Security policies
├── logo-full-horizontal.png
├── .env.example
└── README.md
```

## Forms & Data Flow

| Form | Supabase Table | Public Insert | Admin Access |
|------|---------------|---------------|--------------|
| Waitlist | `waitlist_leads` | ✅ Anyone | ✅ Authenticated admin |
| Prototype Request | `prototype_requests` | ✅ Anyone | ✅ Authenticated admin |
| Feature Suggestion | `feature_suggestions` | ✅ Anyone | ✅ Authenticated admin |

**Fallback:** If Supabase is unreachable, submissions save to `localStorage` and display a success message. Admin can view failed backups in Settings.

## Admin Dashboard

URL: `/admin.html`

Features:
- Supabase Auth email/password login
- Role-based access (must exist in `admin_profiles`)
- Overview stats (total leads, prototypes, suggestions, campaigns)
- Waitlist, Prototype, and Suggestion tables with status management
- Newsletter campaign planner (create, edit, send test, send)
- Data export (JSON)
- Failed backup viewer

### Status Options

**Waitlist:** New → Contacted → Interested → Prototype Requested → Converted → Not Interested
**Prototypes:** New → In Review → Prototype Started → Prototype Sent → Waiting Feedback → Converted → Closed
**Suggestions:** New → Reviewed → Planned → Rejected → Implemented

## Email Sequence

Initial 5-email sequence planned for early users:

1. Welcome to Winlerr Early Access
2. Why Online Presence Matters for Small Businesses
3. What Your Free 30-Day Prototype Can Include
4. How Winlerr Will Help With Content, Customers, and Automation
5. Invite to Request a Prototype / Book a Short Call

## Testing Checklist

- [ ] Waitlist form saves to Supabase
- [ ] Prototype form saves to Supabase
- [ ] Suggestion form saves to Supabase
- [ ] Admin login works with valid credentials
- [ ] Non-admin users see "Access denied"
- [ ] Admin can view all waitlist leads
- [ ] Admin can update statuses on all tables
- [ ] Admin can delete records
- [ ] Newsletter drafts can be created and edited
- [ ] Test email sends to admin
- [ ] Mobile layout works correctly
- [ ] Forms fall back to localStorage when Supabase is offline

## Deployment

This is a static site. Deploy to any static host:

- **Vercel:** `vercel --prod`
- **Netlify:** Drag `index.html` or connect Git repo
- **Cloudflare Pages:** Connect Git repo
- **GitHub Pages:** Push to `main` branch

For Resend integration in production, deploy the `/api/resend.js` as a serverless function on Vercel/Netlify.

## License

Private — Winlerr internal use.
