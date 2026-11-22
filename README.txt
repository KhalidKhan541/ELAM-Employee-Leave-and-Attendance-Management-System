================================================================================
SEMESTER PROJECT PACK — Software Construction and Development
Employee Leave and Attendance Management System (ELAM)
Version 1.2.0  |  21 November 2026
================================================================================

PROGRAMME / DEPARTMENT
  BS Software Engineering

TEAM MEMBERS
  Khalid Khan   (24P-3004) - Process lead / backend, architecture, refactoring
  Javed Ali     (24P-3074) - Frontend / UI, testing, peer reviews
  Saad Ahmad    (24P-3009) - Database / DevOps, requirements, documentation

WHAT THIS IS
  A web application that replaces spreadsheet-based leave and attendance
  tracking for small companies. It supports role-based sign-in, daily
  attendance, leave requests with a two-step approval workflow, automatic
  leave balances, payroll summaries, HR reports, and a full audit log.

HOW TO RUN (local)
  1. Install Node.js 20 or newer.
  2. cd source
  3. npm install
  4. cp .env.example .env
  5. npx prisma db push
  6. npm run db:seed
  7. npm run dev
  8. Open http://localhost:3000

DEMO LOGIN (all accounts use password: Password123!)
  hr@elams.test          HR / Admin  - full access
  manager@elams.test     Manager     - approvals, reports, payroll
  employee@elams.test    Employee    - attendance and own leave

HOW TO VERIFY
  cd source
  npm run typecheck
  npm test
  npm run test:coverage
  npm run build

DEPLOYMENT
  The source/ folder is the Vercel project root. Push main to GitHub, set
  Root Directory = source, add DATABASE_URL and JWT_SECRET in Vercel, and
  use the build command from deployment/vercel.json. Full guide:
  deployment/deploy-guide.md

ZIP CONTENTS
  report/        Report in PDF and Word, figures, screenshots
  source/        Full application code, tests, README.md
  database/      SQL schema, sample data, legacy sample
  diagrams/      UML, ER, activity and sequence diagrams (PlantUML + SVG)
  tests/         Test plan, cases, reports, system test guide
  deployment/    Vercel config, release notes, backup/restore scripts
  reviews/       Review checklists, PSP/TSP logs, defect and change logs
  README.txt     This file

SPECIFICATIONS
  All markdown specifications in docs/ were written before implementation
  (spec-driven development). Start with docs/README.md.
================================================================================
