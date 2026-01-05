You are an expert full-stack developer. Build a complete, production-ready MVP CRM for a home services company with two divisions: Renovations (one-call-close bathroom remodeling) and Radiance (subscription-based exterior home services).

Strict Tech Stack:
- Backend: Node.js + Express (REST API)
- Database: MongoDB with Mongoose
- Frontend: Vue 3 (Composition API + Vite + Pinia) using QUASAR FRAMEWORK (NOT Tailwind)
- Authentication: JWT with role-based access control
- File storage: Use placeholder strings (S3 key style) for PDFs and photos
- Calendar: FullCalendar Vue wrapper (compatible with Quasar)
- PWA: Enable Quasar PWA mode for installer mobile access

Core Models (Mongoose):

1. User
   - name, email (unique), password (hashed)
   - role: enum ['Owner', 'Admin', 'Sales', 'BDC', 'Installer']
   - divisionAccess: array enum ['Renovations', 'Radiance'] (default both for Owner/Admin)

2. Contact (central entity - one per real customer)
   - name, address, phones[], emails[]
   - leadSource: enum ['Angi', 'Website', 'Avira', 'Facebook', 'Home Show', 'Referral', 'Other']
   - contactType: enum ['Residential', 'Commercial', 'Supplier']
   - contactCategory: enum ['Lead', 'Prospect', 'Customer', 'Previous Customer']
   - divisions: array enum ['Renovations', 'Radiance']
   - notes, activityLog: [{ timestamp, userName, action }]

3. Project (Renovations division only - linked to Contact)
   - contact (ref), contractAmount, contractPDF, workbookPDF
   - assignedInstallers[] (ref User)
   - status: enum ['Demo', 'In Progress', 'Hung', 'Completed-Service', 'Completed-Funded', 'Closed']
   - installStartDate, installEndDate
   - costs: { materials, labor, processing, misc } (Number)
   - priorCreditDeclines (Number)
   - photos: [{ url, caption, uploadedBy, timestamp }]
   - notes[]

4. Subscription (Radiance division only - linked to Contact)
   - contact (ref)
   - tier: enum ['Glow', 'Brilliance', 'Eternal']
   - monthlyPrice, annualPrice (auto-populated on save)
   - billingCycle: 'Monthly' or 'Annual'
   - startDate, renewalDate
   - visitsRemaining (Number)
   - repairsCreditUsed (Number, max 800 for Eternal)
   - lightsIncluded (Boolean)
   - status: enum ['Active', 'Paused', 'Cancelled', 'Expired']
   - serviceHistory: [{ date, serviceType, notes, photos[] }]

Business Rules:
- A single Contact can belong to both divisions (e.g., Renovations remodel + Radiance subscription)
- Renovations pipeline: New Lead → Appointment Scheduled → Appointment Completed → Contract Signed (creates Project) → Initial Funding → Scrub phases → Project In Progress → Completed → Past Customer
- Appointment Outcome form (Sales only): Closed → upload contract → create Project; or Did Not Close → objection dropdown + elaboration + "Move to Lost?" checkbox
- Commission logic (Renovations only): as previously defined (Admin 4/4/3/2%, Sales 10% or $400 floor, etc.)
- Calendar: supports multi-day Renovations installs and recurring Radiance service visits

UI Requirements (use Quasar components exclusively):
- Full Quasar app with q-layout, q-page-container, q-toolbar, q-tabs, q-table, q-dialog, q-card, q-select, q-input, q-uploader, q-datepicker
- Mobile-first PWA (manifest + service worker enabled)
- Contact detail page with q-tabs: "Renovations" (pipeline + Project) and "Radiance" (subscription + service history)
- Dashboard with division selector (q-select) and role-based views
- Installer view: simplified mobile layout showing only assigned jobs, PDFs, photos, status update, notes
- CalendarView using FullCalendar inside Quasar page
- Photo gallery using q-carousel or grid
- Dark mode support (Quasar built-in)

Deliver:
- Complete project structure (backend/ and frontend/ folders)
- All Mongoose models with proper refs and validation
- Key routes/controllers (auth, contacts, projects, subscriptions, calendar, files)
- Quasar Vue components: Dashboard, ContactList, ContactDetail (with tabs), ProjectDetail, SubscriptionDetail, InstallerView, AppointmentOutcomeDialog, CalendarView
- Pinia store for auth and current division
- Axios API service
- Seed data: 3 users per role, sample Contacts in Renovations only, Radiance only, and both divisions

Keep scope tight — no payment processing, no email/SMS, manual status updates only. Make it clean, runnable, and deployable to Railway/Vercel.