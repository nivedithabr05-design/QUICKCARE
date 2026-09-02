# QuickCare — Smart Hospital Management System

A front-end demo recreating the QuickCare dashboard design: voice-guided
department navigation, doctor listings, patient admission, a live patient
queue, prescriptions, food plans, and billing — all backed by a lightweight
in-browser database (localStorage) so it runs anywhere with no server setup.

## Run it
Just open `index.html` in a browser (Chrome recommended for the Voice
Assistant, which uses the Web Speech API). No install or build step needed.

## Structure
```
quickcare/
├── index.html      Page layout / all sections
├── css/style.css   Styling
├── js/data.js      Departments, doctors, seed patients
└── js/app.js       App logic (navigation, forms, "database")
```

## Features
- **Voice Assistant** — tap the mic, say a department (e.g. "Cardiology")
  and get a spoken-to-text-matched navigation direction. Falls back to a
  typed prompt in browsers without speech recognition support.
- **Doctors** — filterable list by department, with availability status.
  No consultation fee shown, matching the original brief.
- **Admit Patient** — look up by ID/phone or register a new patient; adds
  them to that department's queue.
- **Patient Queue** — live table of waiting / in-consultation / admitted
  patients, filterable by department.
- **Create Prescription** — add medicines with dosage/frequency/duration/
  price, save it, and "send" it as an SMS (shown in the phone preview).
- **Food Plan** — pick a diet plan, meal timing, and instructions per
  patient.
- **Generate Bill** — auto-built from consultation, room, medicines
  (from the saved prescription), labs, and food charges; save or send.
- **Database** — a simple viewer into the underlying collections
  (patients, queue, prescriptions, food_plans, bills).

## Notes on data
This is a demo, so patient/billing data is stored in the browser's
`localStorage`, not a real database. To wire it up to MongoDB (as in the
original design) you'd swap the `loadDB` / `saveDB` calls in `js/app.js`
for API calls to a small backend (e.g. Node/Express + Mongoose) exposing
`/patients`, `/queue`, `/prescriptions`, `/food_plans`, and `/bills`
routes.

## Seed data
Four sample Pediatrics patients (P1004–P1011) are preloaded, matching the
example shown in the design mockup, so Billing/Prescription/Food Plan can
be tried immediately by looking up `P1004`.
