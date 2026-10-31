export type Category = "IT" | "ESPORTS" | "BOTH"

export interface Project {
  id: string
  title: string
  subtitle: string
  description: string
  category: Category
  tags: string[]
  year: string
  image?: string
  // Real screenshot/cover shown by SelectedWorks.tsx. Point it at a file in
  // `/public/projects/...`; omit it to keep the generated letter-mark cover.
  coverImage?: string
  link?: string
  featured?: boolean
}

export interface Experience {
  id: string
  role: string
  organization: string
  period: string
  description: string
  category: Category
  highlights: string[]
}

export interface Skill {
  name: string
  level: number // 1-5
  category: "IT" | "ESPORTS"
  group: string
}

export interface Certificate {
  id: string
  title: string
  issuer: string
  year: string
  category: "IT" | "ORGANIZATION"
  description: string
  image?: string
  verificationUrl?: string
}

export const projects: Project[] = [
  // ── Proyek (flagship projects) ──────────────────────────────────────────
  {
    id: "p1",
    title: "StudyHub",
    subtitle: "All-in-one academic productivity app for students",
    description:
      "A free academic productivity web app that helps students manage tasks, deadlines, study goals, and a weekly planner in a single place.",
    category: "IT",
    tags: ["Next.js", "Productivity", "Student Tools"],
    year: "2025",
    coverImage: "/projects/p1-studyhub.jpg",
    link: "https://study-hub.web.id/",
    featured: true,
  },
  {
    id: "p2",
    title: "TERA Esports — Digital Ecosystem",
    subtitle: "Official digital platform for a university esports organization",
    description:
      "The official digital ecosystem for TERA Esports, centralizing organizational information, documentation, statistics, and team history for the club.",
    category: "BOTH",
    tags: ["Next.js", "Esports Operations", "Org Platform"],
    year: "2025",
    coverImage: "/projects/p2-teraesports.jpg",
    link: "https://teraesports.vercel.app/",
    featured: true,
  },
  {
    id: "p3",
    title: "DOAIBU — Robocode Tank Royale Bot",
    subtitle: "Greedy-algorithm bot for a tank battle simulator",
    description:
      "A university algorithm-strategy project building an adaptive, risk-minimizing greedy bot for Robocode Tank Royale — combining anti-gravity movement, virtual bullet simulation, and predictive targeting. Placed first across head-to-head testing against three alternative bots.",
    category: "IT",
    tags: ["C#", "Algorithms", "Game AI"],
    year: "2025",
    link: "https://github.com/arul-hue/TubesStima_DOAIBU",
    featured: true,
  },
  {
    id: "p4",
    title: "MindMesh",
    subtitle: "Local-first knowledge universe & quiz app",
    description:
      "A local-first study web app that turns reading material into an explorable, evidence-backed knowledge universe — import PDFs or Markdown, curate concepts and relationships that carry source references, explore the graph in 3D, and practice with a rule-based quiz engine. Runs entirely in the browser on IndexedDB, with optional AI assistance off by default.",
    category: "IT",
    tags: ["TypeScript", "Local-first", "WebGL"],
    year: "2026",
    coverImage: "/projects/p4-mindmesh.jpg",
    link: "https://zann06.github.io/MindMesh/",
    featured: true,
  },
  {
    id: "p5",
    title: "TinyWorld",
    subtitle: "Browser-based 3D exploration game",
    description:
      "An open-source 3D exploration game that runs entirely in the browser — three procedurally generated islands with 26 interactive landmarks, a five-step discovery campaign, a day/night cycle, and photo mode, all rendered with WebGL 2 via Three.js. No downloads or bundled art assets, with hybrid keyboard/mouse and touch controls.",
    category: "IT",
    tags: ["TypeScript", "Three.js", "Procedural Generation"],
    year: "2026",
    coverImage: "/projects/p5-tinyworld.jpg",
    link: "https://zann06.github.io/TinyWorld/",
    featured: true,
  },
  {
    id: "p6",
    title: "CipherLab",
    subtitle: "Interactive block cipher cryptography lab",
    description:
      "A web-based cryptography laboratory built for a university Cryptography & Information Security course — a custom 16-bit Feistel block cipher with ECB, CBC, and CTR modes, step-by-step round tracing with HEX/BIN block inspection and key-schedule walkthroughs, plus instant PDF practicum reports via ReportLab. Built with Streamlit and covered by pytest test suites.",
    category: "IT",
    tags: ["Python", "Cryptography", "Streamlit"],
    year: "2026",
    coverImage: "/projects/p6-cipherlab.jpg",
    link: "https://github.com/zann06/Enskripsi-Block-Cipher",
    featured: true,
  },
  // ── Mini Proyek (smaller side projects) ─────────────────────────────────
  {
    id: "mp1",
    title: "MindWealth Digital",
    subtitle: "Financial literacy & money psychology e-book platform",
    description:
      "A tiered e-book platform built with two teammates to teach financial literacy and money psychology to young readers, featuring a compound-interest calculator and an investor-profile quiz.",
    category: "IT",
    tags: ["Web Design", "Financial Literacy", "JavaScript"],
    year: "2025",
    coverImage: "/projects/mp1-mindwealth.jpg",
    link: "https://mindwealth-digital.vercel.app/",
    featured: false,
  },
  {
    id: "mp2",
    title: "Zoee Money System",
    subtitle: "Offline-first personal finance tracker",
    description:
      "A private, offline-first personal money management tool for tracking daily cashflow, enforcing a weekly spending limit, and running a 30-day no-spend challenge, with all data kept on-device.",
    category: "IT",
    tags: ["Personal Finance", "Offline-first", "JavaScript"],
    year: "2025",
    coverImage: "/projects/mp2-zoee.jpg",
    link: "https://money-system-nu.vercel.app/",
    featured: false,
  },
  {
    id: "mp3",
    title: "Wedding Invitation — Faruq & Ina",
    subtitle: "Digital wedding invitation microsite",
    description:
      "A custom digital wedding invitation site built for a couple, covering event details, an RSVP flow, and a shareable story timeline.",
    category: "IT",
    tags: ["Web Development", "UI Design"],
    year: "2025",
    coverImage: "/projects/mp3-wedding.jpg",
    link: "https://wedding-togetherforever.vercel.app/",
    featured: false,
  },
  {
    id: "mp4",
    title: "TradeReward — Performance Tracker",
    subtitle: "Gamified trading journal & portfolio dashboard",
    description:
      "A trading performance dashboard that tracks balance, profit/loss, win rate, and an equity curve over time, with a gamified XP and level system to reward consistent trading habits.",
    category: "IT",
    tags: ["Trading", "Dashboard", "JavaScript"],
    year: "2025",
    coverImage: "/projects/mp4-trade.jpg",
    link: "https://trade-two-ruby.vercel.app/",
    featured: false,
  },
  {
    id: "mp5",
    title: "Web Prodi Teknologi Industri Pangan",
    subtitle: "Collaborative website integration for the study program",
    description:
      "A collaborative engagement to help integrate the official website of the Teknologi Industri Pangan (Food Industry Technology) study program — hands-on web work done together with the program's team.",
    category: "IT",
    tags: ["Web Integration", "Collaboration"],
    year: "2026",
    coverImage: "/projects/mp5-tip-web.jpg",
    featured: false,
  },
]

export const experiences: Experience[] = [
  {
     id: "e0",
    role: "Head of Technology & IT",
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2026 – Present",
    description:
      "Leading Tera Esports' technology direction, architecting and maintaining the organization's integrated digital ecosystem — from the public website to internal documentation and statistics tools.",
    category: "IT",
    highlights: [
      "Designed and built Tera Esports' integrated digital ecosystem",
      "Owns the organization's web platform, documentation, and internal tooling",
      "Bridges the technology and game/athletics departments",
    ],
  
  },
  {
    id: "e0b",
    role: "Independent Developer — StudyHub",
    organization: "Personal Project",
    period: "2026",
    description:
      "Built StudyHub, an academic productivity web app, from the ground up — including planners, goal tracking, Google Calendar sync, push notifications straight to the phone, and dashboards for monitoring schedules and productivity stats.",
    category: "IT",
    highlights: [
      "Implemented mobile push notifications for tasks and deadlines",
      "Built planner and goal-tracking features with Google Calendar integration",
      "Added productivity stat tracking and schedule monitoring dashboards",
    ],
  },
  {
    id: "e1",
    role: "Workflow Automation Developer (n8n)",
    organization: "Freelance — Tangerang",
    period: "2026",
    description:
      "Building meeting and work automation systems with n8n, connecting apps and services to automate scheduling, follow-ups, and other repetitive business workflows for clients in Tangerang.",
    category: "IT",
    highlights: [
      "Designed n8n workflows to automate meeting scheduling and follow-ups",
      "Integrated multiple apps and services into end-to-end automated pipelines",
      "Reduced manual effort on repetitive business processes for clients",
    ],
  },
  {
    id: "e2",
    role: "Kepala Departemen Game & Keatletan",
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2026 – Present",
description:
  "Heading the Game & Athletics Department, overseeing three divisions — Research & Development, Team Management, and Events — while running the athlete coaching and development pipeline across Tera Esports' Mobile Legends, Valorant, PUBG Mobile, and Point Blank rosters.",
category: "ESPORTS",
highlights: [
  "Oversees 3 divisions: Research & Development, Management, and Event",
  "Coordinates athlete coaching and development across all rosters",
  "Sets department-wide strategy for competitive performance",
  "Acts as event manager, organizing and running competitions from campus-scale to national-scale events",
  "Mobile Legends: 3 teams (1 ladies, 2 boys) — ladies averaging ~150 stars, boys ranging 300–500+ stars, competing in national & campus series, regional, and inter-campus invitationals",
  "Valorant: 1 team averaging Diamond–Immortal rank, focused on national and campus series",
  "PUBG Mobile: 1 team averaging Conqueror rank, competing in national & campus series and regional",
  "Point Blank: 1 team averaging Mayor–Bintang rank, focused on national campus series",
],
  },
  {
  id: "e2b",
  role: "Team Manager — Esports (Tier 3)",
  organization: "P4LS X VENOM",
  period: "Des 2025 – Apr 2026",
  description:
    "Managed a Tier 3 esports roster spanning both offline and online team setups, keeping the team's average star rating around 400 while focusing on league and regional competition.",
  category: "ESPORTS",
  highlights: [
    "Managed both offline and online team rosters for a Tier 3 organization",
    "Focused competitive efforts on league and regional tournaments",
    "Maintained an average team star rating of ~400",
  ],
},
  {
    id: "e3",
    role: "Kepala Divisi Research and Development",
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2025",
    description:
      "Led the Research & Development division within the Game & Athletics department, driving data-driven player evaluation and meta research for the organization's teams.",
    category: "ESPORTS",
    highlights: [
      "Directed the R&D division's game and athlete research agenda",
      "Supported roster and strategy decisions with structured research",
    ],
  },
  {
    id: "e3b",
    role: "Independent Developer — Mini Projects",
    organization: "Personal Projects",
    period: "2025",
    description:
      "Shipped a series of small independent web projects, including MindWealth Digital, the Zoee Money System, a digital wedding invitation site, and TradeReward, to practice end-to-end product building outside of coursework and organizational work.",
    category: "IT",
    highlights: [
      "Shipped 4 small independent web apps across finance, productivity, and events",
      "Handled design, development, and deployment solo for each project",
    ],
  },
  {
    id: "e4",
    role: "Staf",
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2024",
    description:
      "Served as staff within the Game & Athletics department, supporting day-to-day team operations and athlete program logistics.",
    category: "ESPORTS",
    highlights: [
      "Supported daily operations of the Game & Athletics department",
      "Assisted with athlete program logistics and coordination",
    ],
  },
  {
    id: "e5",
    role: "Professional Esports Player",
    organization: "Alter Ego Academy & Dewa United Esports Academy",
    period: "2021 – 2023",
    description:
      "Competed as an active esports athlete across Jakarta, Batam, and Tangerang, training under two national academy programs and competing in regional and national-level tournaments.",
    category: "ESPORTS",
    highlights: [
      "Champion, Liga Brunei and other regional competitions",
      "Reached the Top 16 qualifiers of MDL Season 8",
      "Trained under Alter Ego Academy and Dewa United Esports Academy",
    ],
  },
]

export const skills: Skill[] = [
  // IT Skills
  { name: "React / Next.js", level: 4, category: "IT", group: "Frontend" },
  { name: "TypeScript", level: 3, category: "IT", group: "Frontend" },
  { name: "Tailwind CSS", level: 4, category: "IT", group: "Frontend" },
  { name: "HTML", level: 5, category: "IT", group: "Frontend" },
  { name: "CSS", level: 4, category: "IT", group: "Frontend" },
  { name: "JavaScript", level: 4, category: "IT", group: "Frontend" },
  { name: "UI/UX Design", level: 3, category: "IT", group: "Frontend" },
  { name: "Node.js", level: 3, category: "IT", group: "Backend" },
  { name: "Supabase", level: 3, category: "IT", group: "Backend" },
  { name: "PostgreSQL / MySQL", level: 3, category: "IT", group: "Backend" },
  { name: "REST API Design", level: 3, category: "IT", group: "Backend" },
  { name: "Data Analysis", level: 3, category: "IT", group: "Research & Data" },
  { name: "Data Visualization", level: 2, category: "IT", group: "Research & Data" },
  { name: "UX Research", level: 3, category: "IT", group: "Research & Data" },
  { name: "Git / GitHub", level: 4, category: "IT", group: "Tools" },
  { name: "Figma", level: 3, category: "IT", group: "Tools" },
  { name: "Docker", level: 2, category: "IT", group: "Tools" },
  // Esports Skills
  { name: "Team Management", level: 5, category: "ESPORTS", group: "Management" },
  { name: "Roster Management", level: 5, category: "ESPORTS", group: "Management" },
  { name: "Event Management", level: 4, category: "ESPORTS", group: "Management" },
  { name: "Athlete Development", level: 4, category: "ESPORTS", group: "Management" },
  { name: "Meta Research", level: 5, category: "ESPORTS", group: "Strategy" },
  { name: "Game Strategy", level: 5, category: "ESPORTS", group: "Strategy" },
  { name: "Opponent Scouting", level: 4, category: "ESPORTS", group: "Strategy" },
  { name: "Patch Analysis", level: 4, category: "ESPORTS", group: "Strategy" },
  { name: "Leadership", level: 5, category: "ESPORTS", group: "Leadership" },
  { name: "Coordination", level: 4, category: "ESPORTS", group: "Leadership" },
  { name: "Public Speaking", level: 3, category: "ESPORTS", group: "Leadership" },
]

// Certificate images live in `/public/certificates/`. Copy the JPGs you have
// into that folder with the exact filenames referenced below — the vault
// will render each one as the card's cover photo automatically.
export const certificates: Certificate[] = [
  {
    id: "c19",
    title: "Agentless Threat Emulation with AttackIQ Flex v3",
    issuer: "AttackIQ Academy",
    year: "2026",
    category: "IT",
    description:
      "AttackIQ Academy course on agentless threat emulation using AttackIQ Flex — safely emulating adversary threat behaviors in a controlled environment without deploying agents. Completion earns 1 CPE credit.",
    image: "/certificates/attackiq-agentless-threat-emulation.jpg",
    verificationUrl:
      "https://www.academy.attackiq.com/certificates/certificate-template?resource=13974&type=course&title=Agentless%20Threat%20Emulation%20with%20AttackIQ%20Flex%20v3&cert_id=6711",
  },
  {
    id: "c1",
    title: "HCIA-Security V4.0 Course",
    issuer: "Huawei ICT Academy",
    year: "2025",
    category: "IT",
    description:
      "Completion of the HCIA-Security V4.0 course covering network security fundamentals, firewall technology, and encryption concepts.",
    image: "/certificates/huawei-hcia-security-v4.jpg",
  },
  {
    id: "c2",
    title: "HCIA Security",
    issuer: "Fresh Graduate Academy — Digital Talent Scholarship (Komdigi)",
    year: "2025",
    category: "IT",
    description:
      "40-hour training covering network security concepts, firewall configuration, NAT, hot standby, IPS, and encryption technology, delivered by Pusat Pengembangan Talenta Digital.",
    image: "/certificates/komdigi-hcia-security.jpg",
  },
  {
    id: "c3",
    title: "Dasar-Dasar Keamanan Siber Untuk Pemula",
    issuer: "Fresh Graduate Academy — Digital Talent Scholarship (Komdigi)",
    year: "2025",
    category: "IT",
    description:
      "16-hour foundational training on cybersecurity basics, common digital threats, and practical account protection steps.",
    image: "/certificates/komdigi-dasar-keamanan-siber.jpg",
  },
  {
    id: "c4",
    title: "Ethical Hacker For Dummies",
    issuer: "Digital Talent Scholarship (Komdigi) — Micro Skill",
    year: "2025",
    category: "IT",
    description:
      "Micro-skill training introducing ethical hacking concepts and the fundamentals of cybersecurity.",
    image: "/certificates/komdigi-ethical-hacker-dummies.jpg",
  },
  {
    id: "c5",
    title: "Introduction to Cyber Security and Career Awareness",
    issuer: "Digital Talent Scholarship (Komdigi) — Micro Skill",
    year: "2025",
    category: "IT",
    description:
      "Micro-skill training introducing cybersecurity career paths and foundational awareness.",
    image: "/certificates/komdigi-intro-cybersecurity-career.jpg",
  },
  {
    id: "c6",
    title: "CYBERSHIELD 2025 — Network & Cyber Security Workshop",
    issuer: "Ethereal Learn x HackPoint",
    year: "2025",
    category: "IT",
    description:
      "Certificate of participation in the CYBERSHIELD 2025 workshop covering network and cybersecurity fundamentals.",
    image: "/certificates/cybershield-2025.jpg",
  },
  {
    id: "c7",
    title: "HackPoint Starter Red Team Bootcamp",
    issuer: "HackPoint",
    year: "2025",
    category: "IT",
    description:
      "7-day intensive bootcamp covering cybersecurity fundamentals, network basics, Linux essentials, web application security, the OWASP Top 10, pentest workflow, and a CTF challenge.",
    image: "/certificates/hackpoint-bootcamp1.jpg",
  },
  {
    id: "c8",
    title: "Belajar Dasar AI",
    issuer: "Dicoding Indonesia",
    year: "2025",
    category: "IT",
    description:
      "10-hour course covering AI fundamentals, data for AI, an introduction to machine learning, and deep learning basics, concluded with a final exam.",
    image: "/certificates/dicoding-belajar-dasar-ai.jpg",
  },
  {
    id: "c9",
    title: "Introduction to Computers and Operating Systems and Security",
    issuer: "Microsoft / Coursera",
    year: "2025",
    category: "IT",
    description:
      "Non-credit course authorized by Microsoft covering computer and operating system fundamentals and security basics.",
    image: "/certificates/coursera-intro-computers-security.jpg",
    verificationUrl: "https://coursera.org/verify/20R4A3UBHAGH",
  },
  {
    id: "c10",
    title: "Play It Safe: Manage Security Risks",
    issuer: "Google / Coursera",
    year: "2025",
    category: "IT",
    description:
      "Non-credit course authorized by Google covering security risk management as part of the Google Cybersecurity track.",
    image: "/certificates/coursera-play-it-safe.jpg",
    verificationUrl: "https://coursera.org/verify/V3XP5LUK6C7B",
  },
  {
    id: "c11",
    title: "Dasar-Dasar Pengujian Perangkat Lunak",
    issuer: "Growia",
    year: "2024",
    category: "IT",
    description:
      "Webinar certificate on the fundamentals of software testing and quality assurance basics.",
    image: "/certificates/growia-software-testing-webinar.jpg",
  },
  {
    id: "c12",
    title: 'Webinar Nasional: "Manfaat IoT untuk Sistem Informasi"',
    issuer: "Universitas STEKOM & partner universities",
    year: "2022",
    category: "IT",
    description:
      "Participation certificate for a national webinar on the benefits of IoT for information systems, jointly organized by several Indonesian universities.",
    image: "/certificates/stekom-webinar-iot.jpg",
  },
  {
    id: "c13",
    title: "Kepala Divisi Research and Development",
    issuer: "UKM Tera Esports — Institut Teknologi Sumatera (ITERA)",
    year: "2025/2026",
    category: "ORGANIZATION",
    description:
      "Certificate of appreciation for serving as Head of the Research and Development Division of UKM Tera Esports for the 2025/2026 period.",
    image: "/certificates/tera-esports-kadiv-rnd.jpg",
  },
  {
    id: "c14",
    title: "Effective Speaking and Listening Skills (Bahasa)",
    issuer: "Wadhwani Foundation — Institut Teknologi Sumatera (Itera)",
    year: "2025",
    category: "ORGANIZATION",
    description:
      "Microcertificate covering effective speaking and listening skills, part of a 79-hour combined in-class and online training program.",
    image: "/certificates/wadhwani-speaking-listening.jpg",
  },
  {
    id: "c15",
    title: "Impactful Writing Skills (Bahasa)",
    issuer: "Wadhwani Foundation — Institut Teknologi Sumatera (Itera)",
    year: "2025",
    category: "ORGANIZATION",
    description:
      "Microcertificate covering impactful writing skills, part of a 79-hour combined in-class and online training program.",
    image: "/certificates/wadhwani-impactful-writing.jpg",
  },
  {
    id: "c16",
    title: "JobReady: Employability Skills (Bahasa)",
    issuer: "Wadhwani Foundation — Institut Teknologi Sumatera (Itera)",
    year: "2025",
    category: "ORGANIZATION",
    description:
      "Certificate of completion for employability skills training, part of a 79-hour combined in-class and online program.",
    image: "/certificates/wadhwani-jobready-employability.jpg",
  },
  {
    id: "c17",
    title: "Pelatihan Pendamping Proses Produk Halal",
    issuer: "Badan Penyelenggara Jaminan Produk Halal (BPJPH) — Kementerian Agama RI",
    year: "2026",
    category: "ORGANIZATION",
    description:
      "20-hour online training and passing certification as a Halal Process Assistant, organized in cooperation with Institut Teknologi Sumatera.",
    image: "/certificates/bpjph-produk-halal.jpg",
  },
  {
    id: "c18",
    title: "Volunteer PES — Dies Natalis 12 ITERA",
    issuer: "Institut Teknologi Sumatera (ITERA)",
    year: "2025",
    category: "ORGANIZATION",
    description:
      "Certificate of appreciation for serving as a PES volunteer in the Dies Natalis 12 ITERA anniversary event series.",
    image: "/certificates/itera-dies-natalis-pes-volunteer.jpg",
  },
]