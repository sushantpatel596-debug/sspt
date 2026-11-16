# SSPT — Student Skill & Placement Tracker (Demo)

A presentation-ready React + TypeScript dashboard for demonstrating a Student Skill & Placement Tracker. The default configuration runs in **demo mode** and does not require Supabase, a database, or login credentials.

## Demo access

1. Install Node.js 20 or newer.
2. In this folder run `npm install`.
3. Run `npm run dev` and open the local URL printed by Vite.
4. Choose Admin, Placement Officer, Faculty, or Student on the welcome screen.

The app includes sample student records, placement readiness metrics, company listings, application statuses, charts, and role-specific navigation. Demo mode is read-only and stores the selected demo role in the current browser's local storage. It is intended for classroom presentation only; sample data is not shared between visitors and is not secure institutional storage.

## Publish as a public website

### Vercel (simple path)

1. Push this project folder to a GitHub repository.
2. Sign in to Vercel and choose **Add New → Project**.
3. Import the GitHub repository.
4. Keep the detected Vite settings: build command `npm run build`, output directory `dist`.
5. Do not add Supabase environment variables for the demo build.
6. Deploy. Vercel will provide a public `*.vercel.app` URL.

### Netlify

1. Import the GitHub repository in Netlify.
2. Set build command to `npm run build` and publish directory to `dist`.
3. Deploy and use the public URL Netlify provides.

## Important limitations

- This is a demo, not a production college placement system.
- Records are sample data bundled with the app; changes are not shared or centrally saved.
- Demo role selection is not authentication and must not be used to protect real student information.
- The readiness insight is a transparent sample rule-based indicator, not a connected generative-AI service.
- Before real institutional use, connect a backend, implement authenticated role-based authorization, validate all inputs server-side, and complete security and privacy testing.

## Optional backend

The project retains the Supabase client and SQL migration as a future integration path. No Supabase project is needed to run or deploy the default demo.
