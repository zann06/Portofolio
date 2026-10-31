import { bi, type Bi } from "@/lib/i18n"

export type Category = "IT" | "ESPORTS" | "BOTH"

// Text fields accept a plain string (same in both languages) or a `bi(en, id)`
// pair resolved by the active language in the UI layer.
export interface Project {
  id: string
  title: Bi | string
  subtitle: Bi | string
  description: Bi | string
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
  role: Bi | string
  organization: Bi | string
  period: Bi | string
  description: Bi | string
  category: Category
  highlights: (Bi | string)[]
}

export interface Skill {
  name: string
  level: number // 1-5
  category: "IT" | "ESPORTS"
  group: string
}

export interface Certificate {
  id: string
  title: Bi | string
  issuer: Bi | string
  year: string
  category: "IT" | "ORGANIZATION"
  description: Bi | string
  image?: string
  verificationUrl?: string
}

export const projects: Project[] = [
  // ── Proyek (flagship projects) ──────────────────────────────────────────
  {
    id: "p1",
    title: "StudyHub",
    subtitle: bi("All-in-one academic productivity app for students", "Aplikasi produktivitas akademik all-in-one untuk mahasiswa"),
    description: bi(
      "A free academic productivity web app that helps students manage tasks, deadlines, study goals, and a weekly planner in a single place.",
      "Aplikasi web produktivitas akademik gratis yang membantu mahasiswa mengelola tugas, deadline, target belajar, dan planner mingguan dalam satu tempat."
    ),
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
    subtitle: bi("Official digital platform for a university esports organization", "Platform digital resmi untuk organisasi esports kampus"),
    description: bi(
      "The official digital ecosystem for TERA Esports, centralizing organizational information, documentation, statistics, and team history for the club.",
      "Ekosistem digital resmi TERA Esports yang memusatkan informasi organisasi, dokumentasi, statistik, dan sejarah tim dalam satu tempat."
    ),
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
    subtitle: bi("Greedy-algorithm bot for a tank battle simulator", "Bot algoritme greedy untuk simulator pertarungan tank"),
    description: bi(
      "A university algorithm-strategy project building an adaptive, risk-minimizing greedy bot for Robocode Tank Royale — combining anti-gravity movement, virtual bullet simulation, and predictive targeting. Placed first across head-to-head testing against three alternative bots.",
      "Proyek strategi algoritme kuliah: membangun bot greedy adaptif yang meminimalkan risiko untuk Robocode Tank Royale — menggabungkan gerakan anti-gravity, simulasi tembakan virtual, dan targeting prediktif. Finis pertama dalam pengujian head-to-head melawan tiga bot alternatif."
    ),
    category: "IT",
    tags: ["C#", "Algorithms", "Game AI"],
    year: "2025",
    link: "https://github.com/arul-hue/TubesStima_DOAIBU",
    featured: true,
  },
  {
    id: "p4",
    title: "MindMesh",
    subtitle: bi("Local-first knowledge universe & quiz app", "Aplikasi knowledge universe & kuis yang local-first"),
    description: bi(
      "A local-first study web app that turns reading material into an explorable, evidence-backed knowledge universe — import PDFs or Markdown, curate concepts and relationships that carry source references, explore the graph in 3D, and practice with a rule-based quiz engine. Runs entirely in the browser on IndexedDB, with optional AI assistance off by default.",
      "Aplikasi belajar local-first yang mengubah materi bacaan menjadi knowledge universe yang bisa dijelajahi dan didukung bukti — impor PDF atau Markdown, kurasi konsep dan relasi yang membawa referensi sumber, jelajahi grafnya dalam 3D, dan latihan lewat mesin kuis berbasis aturan. Berjalan sepenuhnya di browser lewat IndexedDB, dengan bantuan AI opsional yang nonaktif secara default."
    ),
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
    subtitle: bi("Browser-based 3D exploration game", "Game eksplorasi 3D berbasis browser"),
    description: bi(
      "An open-source 3D exploration game that runs entirely in the browser — three procedurally generated islands with 26 interactive landmarks, a five-step discovery campaign, a day/night cycle, and photo mode, all rendered with WebGL 2 via Three.js. No downloads or bundled art assets, with hybrid keyboard/mouse and touch controls.",
      "Game eksplorasi 3D open-source yang berjalan sepenuhnya di browser — tiga pulau prosedural dengan 26 landmark interaktif, kampanye penemuan lima langkah, siklus siang/malam, dan photo mode, semuanya dirender dengan WebGL 2 via Three.js. Tanpa unduhan maupun aset seni bawaan, dengan kontrol keyboard/mouse dan sentuh."
    ),
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
    subtitle: bi("Interactive block cipher cryptography lab", "Laboratorium kriptografi block cipher interaktif"),
    description: bi(
      "A web-based cryptography laboratory built for a university Cryptography & Information Security course — a custom 16-bit Feistel block cipher with ECB, CBC, and CTR modes, step-by-step round tracing with HEX/BIN block inspection and key-schedule walkthroughs, plus instant PDF practicum reports via ReportLab. Built with Streamlit and covered by pytest test suites.",
      "Laboratorium kriptografi berbasis web untuk mata kuliah Kriptografi & Keamanan Informasi — block cipher Feistel 16-bit kustom dengan mode ECB, CBC, dan CTR, penelusuran ronde langkah demi langkah berikut inspeksi blok HEX/BIN dan key schedule, plus laporan praktikum PDF instan via ReportLab. Dibangun dengan Streamlit dan diuji dengan pytest."
    ),
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
    subtitle: bi("Financial literacy & money psychology e-book platform", "Platform e-book literasi keuangan & psikologi uang"),
    description: bi(
      "A tiered e-book platform built with two teammates to teach financial literacy and money psychology to young readers, featuring a compound-interest calculator and an investor-profile quiz.",
      "Platform e-book berjenjang yang dibangun bersama dua rekan tim untuk mengajarkan literasi keuangan dan psikologi uang ke pembaca muda, dilengkapi kalkulator bunga majemuk dan kuis profil investor."
    ),
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
    subtitle: bi("Offline-first personal finance tracker", "Pelacak keuangan pribadi yang offline-first"),
    description: bi(
      "A private, offline-first personal money management tool for tracking daily cashflow, enforcing a weekly spending limit, and running a 30-day no-spend challenge, with all data kept on-device.",
      "Alat pengelolaan uang pribadi yang privat dan offline-first untuk mencatat arus kas harian, menjaga batas belanja mingguan, dan menjalankan tantangan 30 hari tanpa belanja, dengan semua data tersimpan di perangkat."
    ),
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
    subtitle: bi("Digital wedding invitation microsite", "Microsite undangan pernikahan digital"),
    description: bi(
      "A custom digital wedding invitation site built for a couple, covering event details, an RSVP flow, and a shareable story timeline.",
      "Situs undangan pernikahan digital kustom untuk sebuah pasangan, mencakup detail acara, alur RSVP, dan timeline cerita yang bisa dibagikan."
    ),
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
    subtitle: bi("Gamified trading journal & portfolio dashboard", "Jurnal trading & dashboard portofolio bergamifikasi"),
    description: bi(
      "A trading performance dashboard that tracks balance, profit/loss, win rate, and an equity curve over time, with a gamified XP and level system to reward consistent trading habits.",
      "Dashboard performa trading yang melacak saldo, profit/loss, win rate, dan kurva ekuitas dari waktu ke waktu, dengan sistem XP dan level bergamifikasi untuk menghargai kebiasaan trading yang konsisten."
    ),
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
    subtitle: bi("Collaborative website integration for the study program", "Integrasi website prodi secara kolaboratif"),
    description: bi(
      "A collaborative engagement to help integrate the official website of the Teknologi Industri Pangan (Food Industry Technology) study program — hands-on web work done together with the program's team.",
      "Kolaborasi membantu mengintegrasikan website resmi prodi Teknologi Industri Pangan — pekerjaan web hands-on bersama tim prodi."
    ),
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
    role: bi("Head of Technology & IT", "Kepala Teknologi & IT"),
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2026 – Present",
    description: bi(
      "Leading Tera Esports' technology direction, architecting and maintaining the organization's integrated digital ecosystem — from the public website to internal documentation and statistics tools.",
      "Memimpin arah teknologi Tera Esports, merancang dan merawat ekosistem digital terintegrasi organisasi — dari website publik hingga dokumentasi internal dan tools statistik."
    ),
    category: "IT",
    highlights: [
      bi("Designed and built Tera Esports' integrated digital ecosystem", "Merancang dan membangun ekosistem digital terintegrasi Tera Esports"),
      bi("Owns the organization's web platform, documentation, and internal tooling", "Mengelola platform web, dokumentasi, dan tooling internal organisasi"),
      bi("Bridges the technology and game/athletics departments", "Menjembatani departemen teknologi dan game/atletik"),
    ],
  },
  {
    id: "e0b",
    role: bi("Independent Developer — StudyHub", "Developer Independen — StudyHub"),
    organization: bi("Personal Project", "Proyek Pribadi"),
    period: "2026",
    description: bi(
      "Built StudyHub, an academic productivity web app, from the ground up — including planners, goal tracking, Google Calendar sync, push notifications straight to the phone, and dashboards for monitoring schedules and productivity stats.",
      "Membangun StudyHub, aplikasi web produktivitas akademik, dari nol — termasuk planner, pelacak target, sinkronisasi Google Calendar, notifikasi push langsung ke ponsel, dan dashboard pemantau jadwal serta statistik produktivitas."
    ),
    category: "IT",
    highlights: [
      bi("Implemented mobile push notifications for tasks and deadlines", "Mengimplementasikan notifikasi push mobile untuk tugas dan deadline"),
      bi("Built planner and goal-tracking features with Google Calendar integration", "Membangun fitur planner dan pelacak target dengan integrasi Google Calendar"),
      bi("Added productivity stat tracking and schedule monitoring dashboards", "Menambahkan pelacak statistik produktivitas dan dashboard pemantau jadwal"),
    ],
  },
  {
    id: "e1",
    role: bi("Workflow Automation Developer (n8n)", "Developer Otomasi Workflow (n8n)"),
    organization: "Freelance — Tangerang",
    period: "2026",
    description: bi(
      "Part of a new learning stage: exploring workflow automation with n8n — building meeting and work automation systems that connect apps and services to automate scheduling.",
      "Bagian dari tahap belajar baru: mengeksplorasi otomasi workflow dengan n8n — membangun sistem otomasi rapat dan pekerjaan yang menghubungkan aplikasi dan layanan untuk mengotomatiskan penjadwalan."
    ),
    category: "IT",
    highlights: [
      bi("Learning workflow automation end-to-end — from visual flow design to real client implementations", "Mempelajari otomasi workflow secara menyeluruh — dari desain flow visual hingga implementasi nyata untuk klien"),
      bi("Designed n8n workflows to automate meeting scheduling and follow-ups", "Merancang workflow n8n untuk mengotomatiskan penjadwalan rapat dan tindak lanjut"),
    ],
  },
  {
    id: "e2",
    role: "Kepala Departemen Game & Keatletan",
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2026 – Present",
    description: bi(
      "Heading the Game & Athletics Department, overseeing three divisions — Research & Development, Team Management, and Events — while running the athlete coaching and development pipeline across Tera Esports' Mobile Legends, Valorant, PUBG Mobile, and Point Blank rosters.",
      "Memimpin Departemen Game & Keatletan yang mengawasi tiga divisi — Riset & Pengembangan, Manajemen Tim, dan Event — sekaligus menjalankan pipeline pembinaan dan pengembangan atlet di roster Mobile Legends, Valorant, PUBG Mobile, dan Point Blank Tera Esports."
    ),
    category: "ESPORTS",
    highlights: [
      bi("Coached teams claim 3× first place and 1× runner-up in 2026 — including two national titles (Liga Nasional STAN, National Esports Championship NEXUS)", "Tim binaan meraih 3× Juara 1 dan 1× Juara 2 pada 2026 — termasuk dua gelar nasional (Liga Nasional STAN, National Esports Championship NEXUS)"),
      bi("Oversees 3 divisions: Research & Development, Management, and Event", "Mengawasi 3 divisi: Riset & Pengembangan, Manajemen, dan Event"),
      bi("Coordinates athlete coaching and development across all rosters", "Mengoordinasikan pembinaan dan pengembangan atlet di semua roster"),
      bi("Sets department-wide strategy for competitive performance", "Menetapkan strategi departemen untuk performa kompetitif"),
      bi("Acts as event manager, organizing and running competitions from campus-scale to national-scale events", "Bertindak sebagai event manager, menyelenggarakan kompetisi dari skala kampus hingga nasional"),
      bi("Mobile Legends: 3 teams (1 ladies, 2 boys) — ladies averaging ~150 stars, boys ranging 300–500+ stars, competing in national & campus series, regional, and inter-campus invitationals", "Mobile Legends: 3 tim (1 ladies, 2 boys) — ladies rata-rata ~150 bintang, boys 300–500+ bintang, bertanding di series nasional & kampus, regional, dan invitational antar-kampus"),
      bi("Valorant: 1 team averaging Diamond–Immortal rank, focused on national and campus series", "Valorant: 1 tim rata-rata rank Diamond–Immortal, fokus di series nasional dan kampus"),
      bi("PUBG Mobile: 1 team averaging Conqueror rank, competing in national & campus series and regional", "PUBG Mobile: 1 tim rata-rata rank Conqueror, bertanding di series nasional & kampus serta regional"),
      bi("Point Blank: 1 team averaging Mayor–Bintang rank, focused on national campus series", "Point Blank: 1 tim rata-rata rank Mayor–Bintang, fokus di series nasional kampus"),
    ],
  },
  {
    id: "e2b",
    role: bi("Team Manager — Esports (Tier 3)", "Manajer Tim — Esports (Tier 3)"),
    organization: "P4LS X VENOM",
    period: bi("Dec 2025 – Apr 2026", "Des 2025 – Apr 2026"),
    description: bi(
      "Managed a Tier 3 esports roster spanning both offline and online team setups, keeping the team's average star rating around 400 while focusing on league and regional competition.",
      "Mengelola roster esports Tier 3 untuk setup tim offline maupun online, menjaga rata-rata rating bintang tim di angka 400 dengan fokus ke kompetisi liga dan regional."
    ),
    category: "ESPORTS",
    highlights: [
      bi("Managed both offline and online team rosters for a Tier 3 organization", "Mengelola roster tim offline maupun online untuk organisasi Tier 3"),
      bi("Focused competitive efforts on league and regional tournaments", "Memfokuskan kompetisi ke turnamen liga dan regional"),
      bi("Maintained an average team star rating of ~400", "Menjaga rata-rata rating bintang tim di ~400"),
    ],
  },
  {
    id: "e3",
    role: "Kepala Divisi Research and Development",
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2025",
    description: bi(
      "Led the Research & Development division within the Game & Athletics department, driving data-driven player evaluation and meta research for the organization's teams.",
      "Memimpin divisi Riset & Pengembangan di dalam Departemen Game & Keatletan, menggerakkan evaluasi pemain berbasis data dan riset meta untuk tim organisasi."
    ),
    category: "ESPORTS",
    highlights: [
      bi("Directed the R&D division's game and athlete research agenda", "Mengarahkan agenda riset game dan atlet divisi R&D"),
      bi("Supported roster and strategy decisions with structured research", "Mendukung keputusan roster dan strategi dengan riset terstruktur"),
    ],
  },
  {
    id: "e3b",
    role: bi("Independent Developer — Mini Projects", "Developer Independen — Mini Projects"),
    organization: bi("Personal Projects", "Proyek Pribadi"),
    period: "2025",
    description: bi(
      "Shipped a series of small independent web projects, including MindWealth Digital, the Zoee Money System, a digital wedding invitation site, and TradeReward, to practice end-to-end product building outside of coursework and organizational work.",
      "Menyelesaikan serangkaian proyek web kecil independen — MindWealth Digital, Zoee Money System, situs undangan pernikahan digital, dan TradeReward — untuk melatih pembangunan produk end-to-end di luar tugas kuliah dan organisasi."
    ),
    category: "IT",
    highlights: [
      bi("Shipped 4 small independent web apps across finance, productivity, and events", "Menyelesaikan 4 aplikasi web kecil independen di bidang keuangan, produktivitas, dan acara"),
      bi("Handled design, development, and deployment solo for each project", "Menangani desain, pengembangan, dan deployment sendiri untuk tiap proyek"),
    ],
  },
  {
    id: "e4",
    role: "Staf",
    organization: "Tera Esports — Institut Teknologi Sumatera",
    period: "2024",
    description: bi(
      "Served as staff within the Game & Athletics department, supporting day-to-day team operations and athlete program logistics.",
      "Melayani sebagai staf di Departemen Game & Keatletan, mendukung operasional tim sehari-hari dan logistik program atlet."
    ),
    category: "ESPORTS",
    highlights: [
      bi("Supported daily operations of the Game & Athletics department", "Mendukung operasional harian Departemen Game & Keatletan"),
      bi("Assisted with athlete program logistics and coordination", "Membantu logistik dan koordinasi program atlet"),
    ],
  },
  {
    id: "e5",
    role: bi("Professional Esports Player", "Pemain Esports Profesional"),
    organization: "Alter Ego Academy & Dewa United Esports Academy",
    period: "2021 – 2023",
    description: bi(
      "Competed as an active esports athlete across Jakarta, Batam, and Tangerang, training under two national academy programs and competing in regional and national-level tournaments.",
      "Bertanding sebagai atlet esports aktif di Jakarta, Batam, dan Tangerang, berlatih di dua program akademi nasional dan kompetisi di turnamen tingkat regional hingga nasional."
    ),
    category: "ESPORTS",
    highlights: [
      bi("Champion, Liga Brunei and other regional competitions", "Juara Liga Brunei dan kompetisi regional lainnya"),
      bi("Reached the Top 16 qualifiers of MDL Season 8", "Mencapai Top 16 kualifikasi MDL Season 8"),
      bi("Trained under Alter Ego Academy and Dewa United Esports Academy", "Berlatih di Alter Ego Academy dan Dewa United Esports Academy"),
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
  { name: "Git / GitHub", level: 4, category: "IT", group: "Tools" },
  { name: "Figma", level: 3, category: "IT", group: "Tools" },
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

export interface EsportsAchievement {
  id: string
  date: Bi
  game: string
  tournament: Bi
  /** 1 = champion, 2 = runner-up (drives the badge styling). */
  rank: 1 | 2
  mode: "Online"
  placement: Bi
}

// Team results while Farid was Head of Department & Manager (2026 season).
export const esportsAchievements: EsportsAchievement[] = [
  {
    id: "ea1",
    date: bi("Sep 24, 2026", "24 September 2026"),
    game: "MLBB",
    tournament: bi("National Esports Championship NEXUS", "National Esports Championship NEXUS"),
    rank: 1,
    mode: "Online",
    placement: bi("Champion", "Juara 1"),
  },
  {
    id: "ea2",
    date: bi("Sep 5, 2026", "5 September 2026"),
    game: "MLBB",
    tournament: bi("Liga Nasional STAN 2026", "Liga Nasional STAN 2026"),
    rank: 1,
    mode: "Online",
    placement: bi("Champion", "Juara 1"),
  },
  {
    id: "ea3",
    date: bi("Jul 20, 2026", "20 Juli 2026"),
    game: "MLBB",
    tournament: bi("Vindicta Cup Nasional Mahasiswa", "Vindicta Cup Nasional Mahasiswa"),
    rank: 2,
    mode: "Online",
    placement: bi("Runner-up", "Juara 2"),
  },
  {
    id: "ea4",
    date: bi("May 22, 2026", "22 Mei 2026"),
    game: "MLBB",
    tournament: bi("Big Bang Lampung Timur", "Big Bang Lampung Timur"),
    rank: 1,
    mode: "Online",
    placement: bi("Champion", "Juara 1"),
  },
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
    description: bi(
      "AttackIQ Academy course on agentless threat emulation using AttackIQ Flex — safely emulating adversary threat behaviors in a controlled environment without deploying agents. Completion earns 1 CPE credit.",
      "Kursus AttackIQ Academy tentang emulasi ancaman agentless dengan AttackIQ Flex — mengemulasikan perilaku ancaman adversary secara aman di lingkungan terkendali tanpa memasang agen. Kelulusan memberi 1 kredit CPE."
    ),
    image: "/certificates/attackiq-agentless-threat-emulation.jpg",
    verificationUrl:
      "https://www.academy.attackiq.com/certificates/certificate-template?resource=13974&type=course&title=Agentless%20Threat%20Emulation%20with%20AttackIQ%20Flex%20v3&cert_id=6711",
  },
  {
    id: "c1",
    title: bi("HCIA-Security V4.0 Course", "Pelatihan HCIA-Security V4.0"),
    issuer: "Huawei ICT Academy",
    year: "2025",
    category: "IT",
    description: bi(
      "Completion of the HCIA-Security V4.0 course covering network security fundamentals, firewall technology, and encryption concepts.",
      "Penyelesaian kursus HCIA-Security V4.0 yang mencakup dasar keamanan jaringan, teknologi firewall, dan konsep enkripsi."
    ),
    image: "/certificates/huawei-hcia-security-v4.jpg",
  },
  {
    id: "c2",
    title: "HCIA Security",
    issuer: bi("Fresh Graduate Academy — Digital Talent Scholarship (Komdigi)", "Fresh Graduate Academy — Digital Talent Scholarship (Komdigi)"),
    year: "2025",
    category: "IT",
    description: bi(
      "40-hour training covering network security concepts, firewall configuration, NAT, hot standby, IPS, and encryption technology, delivered by Pusat Pengembangan Talenta Digital.",
      "Pelatihan 40 jam yang mencakup konsep keamanan jaringan, konfigurasi firewall, NAT, hot standby, IPS, dan teknologi enkripsi, diselenggarakan oleh Pusat Pengembangan Talenta Digital."
    ),
    image: "/certificates/komdigi-hcia-security.jpg",
  },
  {
    id: "c3",
    title: "Dasar-Dasar Keamanan Siber Untuk Pemula",
    issuer: bi("Fresh Graduate Academy — Digital Talent Scholarship (Komdigi)", "Fresh Graduate Academy — Digital Talent Scholarship (Komdigi)"),
    year: "2025",
    category: "IT",
    description: bi(
      "16-hour foundational training on cybersecurity basics, common digital threats, and practical account protection steps.",
      "Pelatihan dasar 16 jam tentang fundamental keamanan siber, ancaman digital umum, dan langkah praktis melindungi akun."
    ),
    image: "/certificates/komdigi-dasar-keamanan-siber.jpg",
  },
  {
    id: "c4",
    title: "Ethical Hacker For Dummies",
    issuer: bi("Digital Talent Scholarship (Komdigi) — Micro Skill", "Digital Talent Scholarship (Komdigi) — Micro Skill"),
    year: "2025",
    category: "IT",
    description: bi(
      "Micro-skill training introducing ethical hacking concepts and the fundamentals of cybersecurity.",
      "Pelatihan micro-skill yang memperkenalkan konsep ethical hacking dan fundamental keamanan siber."
    ),
    image: "/certificates/komdigi-ethical-hacker-dummies.jpg",
  },
  {
    id: "c5",
    title: bi("Introduction to Cyber Security and Career Awareness", "Pengantar Keamanan Siber dan Kesadaran Karier"),
    issuer: bi("Digital Talent Scholarship (Komdigi) — Micro Skill", "Digital Talent Scholarship (Komdigi) — Micro Skill"),
    year: "2025",
    category: "IT",
    description: bi(
      "Micro-skill training introducing cybersecurity career paths and foundational awareness.",
      "Pelatihan micro-skill yang memperkenalkan jalur karier keamanan siber dan pemahaman dasarnya."
    ),
    image: "/certificates/komdigi-intro-cybersecurity-career.jpg",
  },
  {
    id: "c6",
    title: "CYBERSHIELD 2025 — Network & Cyber Security Workshop",
    issuer: "Ethereal Learn x HackPoint",
    year: "2025",
    category: "IT",
    description: bi(
      "Certificate of participation in the CYBERSHIELD 2025 workshop covering network and cybersecurity fundamentals.",
      "Sertifikat partisipasi workshop CYBERSHIELD 2025 yang membahas dasar jaringan dan keamanan siber."
    ),
    image: "/certificates/cybershield-2025.jpg",
  },
  {
    id: "c7",
    title: "HackPoint Starter Red Team Bootcamp",
    issuer: "HackPoint",
    year: "2025",
    category: "IT",
    description: bi(
      "7-day intensive bootcamp covering cybersecurity fundamentals, network basics, Linux essentials, web application security, the OWASP Top 10, pentest workflow, and a CTF challenge.",
      "Bootcamp intensif 7 hari yang mencakup fundamental keamanan siber, dasar jaringan, esensial Linux, keamanan aplikasi web, OWASP Top 10, alur pentest, dan tantangan CTF."
    ),
    image: "/certificates/hackpoint-bootcamp1.jpg",
  },
  {
    id: "c8",
    title: "Belajar Dasar AI",
    issuer: "Dicoding Indonesia",
    year: "2025",
    category: "IT",
    description: bi(
      "10-hour course covering AI fundamentals, data for AI, an introduction to machine learning, and deep learning basics, concluded with a final exam.",
      "Kursus 10 jam yang membahas dasar AI, data untuk AI, pengantar machine learning, dan dasar deep learning, ditutup dengan ujian akhir."
    ),
    image: "/certificates/dicoding-belajar-dasar-ai.jpg",
  },
  {
    id: "c9",
    title: bi("Introduction to Computers and Operating Systems and Security", "Pengantar Komputer, Sistem Operasi, dan Keamanan"),
    issuer: "Microsoft / Coursera",
    year: "2025",
    category: "IT",
    description: bi(
      "Non-credit course authorized by Microsoft covering computer and operating system fundamentals and security basics.",
      "Kursus non-kredit dari Microsoft yang membahas fundamental komputer, sistem operasi, dan dasar keamanan."
    ),
    image: "/certificates/coursera-intro-computers-security.jpg",
    verificationUrl: "https://coursera.org/verify/20R4A3UBHAGH",
  },
  {
    id: "c10",
    title: "Play It Safe: Manage Security Risks",
    issuer: "Google / Coursera",
    year: "2025",
    category: "IT",
    description: bi(
      "Non-credit course authorized by Google covering security risk management as part of the Google Cybersecurity track.",
      "Kursus non-kredit dari Google yang membahas manajemen risiko keamanan sebagai bagian dari track Google Cybersecurity."
    ),
    image: "/certificates/coursera-play-it-safe.jpg",
    verificationUrl: "https://coursera.org/verify/V3XP5LUK6C7B",
  },
  {
    id: "c11",
    title: "Dasar-Dasar Pengujian Perangkat Lunak",
    issuer: "Growia",
    year: "2024",
    category: "IT",
    description: bi(
      "Webinar certificate on the fundamentals of software testing and quality assurance basics.",
      "Sertifikat webinar tentang fundamental pengujian perangkat lunak dan dasar quality assurance."
    ),
    image: "/certificates/growia-software-testing-webinar.jpg",
  },
  {
    id: "c12",
    title: 'Webinar Nasional: "Manfaat IoT untuk Sistem Informasi"',
    issuer: bi("Universitas STEKOM & partner universities", "Universitas STEKOM & universitas mitra"),
    year: "2022",
    category: "IT",
    description: bi(
      "Participation certificate for a national webinar on the benefits of IoT for information systems, jointly organized by several Indonesian universities.",
      "Sertifikat partisipasi webinar nasional tentang manfaat IoT untuk sistem informasi, diselenggarakan bersama oleh beberapa universitas Indonesia."
    ),
    image: "/certificates/stekom-webinar-iot.jpg",
  },
  {
    id: "c13",
    title: "Kepala Divisi Research and Development",
    issuer: "UKM Tera Esports — Institut Teknologi Sumatera (ITERA)",
    year: "2025/2026",
    category: "ORGANIZATION",
    description: bi(
      "Certificate of appreciation for serving as Head of the Research and Development Division of UKM Tera Esports for the 2025/2026 period.",
      "Sertifikat penghargaan atas pengabdian sebagai Kepala Divisi Riset dan Pengembangan UKM Tera Esports periode 2025/2026."
    ),
    image: "/certificates/tera-esports-kadiv-rnd.jpg",
  },
  {
    id: "c14",
    title: bi("Effective Speaking and Listening Skills (Bahasa)", "Keterampilan Berbicara dan Mendengarkan Efektif"),
    issuer: "Wadhwani Foundation — Institut Teknologi Sumatera (Itera)",
    year: "2025",
    category: "ORGANIZATION",
    description: bi(
      "Microcertificate covering effective speaking and listening skills, part of a 79-hour combined in-class and online training program.",
      "Microcertificate yang mencakup keterampilan berbicara dan mendengarkan efektif, bagian dari program pelatihan gabungan kelas dan online 79 jam."
    ),
    image: "/certificates/wadhwani-speaking-listening.jpg",
  },
  {
    id: "c15",
    title: bi("Impactful Writing Skills (Bahasa)", "Keterampilan Menulis Berdampak"),
    issuer: "Wadhwani Foundation — Institut Teknologi Sumatera (Itera)",
    year: "2025",
    category: "ORGANIZATION",
    description: bi(
      "Microcertificate covering impactful writing skills, part of a 79-hour combined in-class and online training program.",
      "Microcertificate yang mencakup keterampilan menulis berdampak, bagian dari program pelatihan gabungan kelas dan online 79 jam."
    ),
    image: "/certificates/wadhwani-impactful-writing.jpg",
  },
  {
    id: "c16",
    title: bi("JobReady: Employability Skills (Bahasa)", "JobReady: Keterampilan Employability"),
    issuer: "Wadhwani Foundation — Institut Teknologi Sumatera (Itera)",
    year: "2025",
    category: "ORGANIZATION",
    description: bi(
      "Certificate of completion for employability skills training, part of a 79-hour combined in-class and online program.",
      "Sertifikat penyelesaian pelatihan keterampilan employability, bagian dari program gabungan kelas dan online 79 jam."
    ),
    image: "/certificates/wadhwani-jobready-employability.jpg",
  },
  {
    id: "c17",
    title: "Pelatihan Pendamping Proses Produk Halal",
    issuer: bi("Badan Penyelenggara Jaminan Produk Halal (BPJPH) — Kementerian Agama RI", "Badan Penyelenggara Jaminan Produk Halal (BPJPH) — Kementerian Agama RI"),
    year: "2026",
    category: "ORGANIZATION",
    description: bi(
      "20-hour online training and passing certification as a Halal Process Assistant, organized in cooperation with Institut Teknologi Sumatera.",
      "Pelatihan online 20 jam dan lulus sertifikasi sebagai Pendamping Proses Halal, diselenggarakan bekerja sama dengan Institut Teknologi Sumatera."
    ),
    image: "/certificates/bpjph-produk-halal.jpg",
  },
  {
    id: "c18",
    title: bi("Volunteer PES — Dies Natalis 12 ITERA", "Volunteer PES — Dies Natalis 12 ITERA"),
    issuer: "Institut Teknologi Sumatera (ITERA)",
    year: "2025",
    category: "ORGANIZATION",
    description: bi(
      "Certificate of appreciation for serving as a PES volunteer in the Dies Natalis 12 ITERA anniversary event series.",
      "Sertifikat penghargaan atas pengabdian sebagai volunteer PES dalam rangkaian Dies Natalis 12 ITERA."
    ),
    image: "/certificates/itera-dies-natalis-pes-volunteer.jpg",
  },
]
