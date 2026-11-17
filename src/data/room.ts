import { bi, type Bi } from "@/lib/i18n"

/**
 * Portfolio content behind the interactive objects in `MyRoomScene`.
 *
 * Each entry is rendered as a clickable pin in the 3D hero diorama; clicking
 * one opens a panel with the copy below. Keep the copy short — the panel is
 * meant as a teaser that links out to the fuller `/data/portfolio.ts` entry,
 * not a replacement for it.
 */

export type RoomHotspotId =
  | "laptop"
  | "monitor"
  | "shelf"
  | "bed"
  | "fridge"
  | "food"
  | "window"
  | "clock"
  | "posters"
  | "plant"
  | "backpack"
  | "lamp"
  | "whiteboard"
  | "carpet"
  | "accessories"

/** Screen-space position of a pin. */
export interface HotspotAnchor {
  left: string
  top: string
}

/**
 * World-space position of each interactive object. The scene projects these
 * against the live camera every frame, so pins stay glued to their object
 * while the camera drifts, orbits, or flies to a focused object.
 */
export const hotspotPoints: Record<RoomHotspotId, [number, number, number]> = {
  laptop: [0.2, 1.32, -1.72],
  lamp: [0.93, 1.5, -1.9],
  monitor: [-0.9, 1.3, -1.92],
  shelf: [2.55, 1.3, -1.0],
  bed: [-2.05, 0.75, -1.35],
  fridge: [2.5, 1.15, 1.35],
  food: [1.35, 0.62, 0.95],
  window: [-2.82, 1.85, -0.45],
  clock: [1.05, 2.52, -2.28],
  posters: [-1.6, 2.05, -2.3],
  whiteboard: [2.2, 1.95, -2.3],
  plant: [-2.7, 0.95, 1.5],
  backpack: [-1.0, 0.45, 0.55],
  accessories: [-0.75, 0.3, 1.55],
  carpet: [0.1, 0.06, 0.15],
}

export interface RoomHotspot {
  id: RoomHotspotId
  /** Full label shown in the panel header. */
  label: Bi
  /** Short verb-led label for the floating pin ("Use laptop"). */
  action: Bi
  eyebrow?: Bi
  body: Bi
  /** Bullet facts — rendered as a small list. */
  points?: Bi[]
  /** Optional outbound CTA. */
  link?: { label: Bi; href: string }
  /** Tags shown as chips. */
  tags?: string[]
}

export const roomHotspots: RoomHotspot[] = [
  {
    id: "laptop",
    label: bi("The laptop — what I build", "Laptop — yang saya bangun"),
    action: bi("Use laptop", "Pakai laptop"),
    eyebrow: bi("Daily driver", "Senjata harian"),
    body: bi(
      "Almost everything on this site started here. Most days it's Next.js or React with TypeScript and Tailwind, talking to Supabase or a small set of APIs — deployed straight from GitHub.",
      "Hampir semua isi situs ini dimulai dari sini. Sebagian besar harinya Next.js atau React dengan TypeScript dan Tailwind, terhubung ke Supabase atau beberapa API kecil — di-deploy langsung dari GitHub."
    ),
    points: [
      bi("AksesAI — verified directory of free & cheap AI resources", "AksesAI — direktori terverifikasi resource AI gratis & murah"),
      bi("StudyHub — academic planner with push notifications", "StudyHub — planner akademik dengan notifikasi push"),
      bi("MindMesh — local-first knowledge graph in 3D", "MindMesh — knowledge graph local-first dalam 3D"),
      bi("FormaAI — reports from your sources, no invented facts", "FormaAI — laporan dari sumber Anda, tanpa fakta karangan"),
    ],
    link: { label: bi("See selected works", "Lihat karya pilihan"), href: "#works" },
    tags: ["Next.js", "TypeScript", "Three.js"],
  },
  {
    id: "lamp",
    label: bi("Desk lamp — late-night focus", "Lampu meja — fokus sampai malam"),
    action: bi("Toggle focus", "Nyalakan fokus"),
    eyebrow: bi("Working style", "Cara kerja"),
    body: bi(
      "Most of the real work happens after dark: reading docs, tracing bugs, and shipping small increments. The lamp is basically the mascot — warm light, one task at a time, no context switching.",
      "Sebagian besar kerja nyata terjadi setelah gelap: baca dokumentasi, telusuri bug, dan rilis sedikit demi sedikit. Lampu ini hampir jadi maskotnya — cahaya hangat, satu tugas sekali jalan, tanpa lompat-lompat konteks."
    ),
    tags: ["Deep work", "Iteration"],
  },
  {
    id: "monitor",
    label: bi("Rig — esports & competition", "Rig — esports & kompetisi"),
    action: bi("Open rig", "Buka rig"),
    eyebrow: bi("Second track", "Jalur kedua"),
    body: bi(
      "The other half of the setup. Before writing web apps I competed as an esports athlete under two national academies — that background is why I default to systems, reviews, and measurable performance.",
      "Setengah setup lainnya. Sebelum menulis aplikasi web, saya bertanding sebagai atlet esports di dua akademi nasional — latar belakang itu yang membuat saya terbiasa berpikir sistem, review, dan performa yang terukur."
    ),
    points: [
      bi("Champion, Liga Brunei & regional tournaments", "Juara, Liga Brunei & turnamen regional"),
      bi("Top 16 qualifiers — MDL Season 8", "Top 16 kualifikasi — MDL Season 8"),
      bi("Alter Ego Academy & Dewa United Esports Academy", "Alter Ego Academy & Dewa United Esports Academy"),
    ],
    tags: ["Esports", "Strategy"],
  },
  {
    id: "whiteboard",
    label: bi("Whiteboard — how I plan", "Papan tulis — cara saya merencana"),
    action: bi("Read notes", "Baca catatan"),
    eyebrow: bi("Process", "Proses"),
    body: bi(
      "Every project starts as sticky notes: who it's for, what breaks, what ships first. Then it becomes a short written plan before any component is written — it keeps scope honest and reviews cheap.",
      "Setiap proyek mulai dari sticky note: untuk siapa, apa yang rusak, apa yang dirilis dulu. Lalu jadi rencana tertulis singkat sebelum satu komponen pun ditulis — scope tetap jujur dan review jadi murah."
    ),
    points: [
      bi("Scope before code — write the plan down", "Scope sebelum kode — tulis rencananya"),
      bi("Small vertical slices, reviewed in CI", "Potongan vertikal kecil, di-review di CI"),
      bi("Tests for the parts that hurt when broken", "Tes untuk bagian yang paling sakit kalau rusak"),
    ],
  },
  {
    id: "clock",
    label: bi("Wall clock — availability", "Jam dinding — ketersediaan"),
    action: bi("Check schedule", "Cek jadwal"),
    eyebrow: bi("Availability", "Ketersediaan"),
    body: bi(
      "Open to selected freelance and collaboration work — web apps, dashboards, and site integration for teams. Replies usually same day, and anything timezone-friendly (WIB, UTC+7) is easy.",
      "Terbuka untuk kerja freelance dan kolaborasi terpilih — aplikasi web, dashboard, dan integrasi situs untuk tim. Biasanya dibalas di hari yang sama, dan semua yang ramah zona waktu (WIB, UTC+7) gampang."
    ),
    link: { label: bi("Get in touch", "Hubungi saya"), href: "#contact" },
  },
  {
    id: "posters",
    label: bi("Posters — the work that shaped me", "Poster — karya yang membentuk saya"),
    action: bi("View posters", "Lihat poster"),
    eyebrow: bi("Selected works", "Karya pilihan"),
    body: bi(
      "Eight flagship projects and a handful of smaller ones — from a community AI resource directory to a browser-based 3D exploration game, an open-source report generator that refuses to invent facts, a crypto lab for coursework, and the official site for a study program.",
      "Delapan proyek utama dan beberapa proyek kecil — dari direktori resource AI komunitas, game eksplorasi 3D di browser, generator laporan open-source yang menolak mengarang fakta, lab kriptografi untuk kuliah, sampai situs resmi sebuah program studi."
    ),
    link: { label: bi("Open selected works", "Buka karya pilihan"), href: "#works" },
  },
  {
    id: "shelf",
    label: bi("Bookshelf — stack & certifications", "Rak buku — stack & sertifikasi"),
    action: bi("Browse shelf", "Lihat rak"),
    eyebrow: bi("Learning", "Pembelajaran"),
    body: bi(
      "The shelf is mostly security and web fundamentals: Huawei HCIA-Security, Komdigi cybersecurity tracks, Coursera, Dicoding, plus halal product certification from BPJPH.",
      "Rak ini isinya kebanyakan dasar keamanan dan web: Huawei HCIA-Security, jalur cybersecurity Komdigi, Coursera, Dicoding, plus sertifikasi produk halal dari BPJPH."
    ),
    link: { label: bi("Open certificate vault", "Buka lemari sertifikat"), href: "#certificates" },
    tags: ["Security", "Web", "Certifications"],
  },
  {
    id: "window",
    label: bi("Window — the view outside", "Jendela — pemandangan di luar"),
    action: bi("Look outside", "Lihat keluar"),
    eyebrow: bi("Based in", "Berbasis di"),
    body: bi(
      "Lampung, Indonesia — studying at Institut Teknologi Sumatera while building products for clients and organizations across the country, mostly remote.",
      "Lampung, Indonesia — kuliah di Institut Teknologi Sumatera sambil membangun produk untuk klien dan organisasi di seluruh Indonesia, kebanyakan remote."
    ),
  },
  {
    id: "bed",
    label: bi("Bed — rest is part of the system", "Kasur — istirahat bagian dari sistem"),
    action: bi("Sleep", "Tidur"),
    eyebrow: bi("Balance", "Keseimbangan"),
    body: bi(
      "Between coursework, the Technology department at Tera Esports, and client work, sleep is what keeps the output consistent. Sustainable pace over heroic nights.",
      "Di antara kuliah, departemen Teknologi Tera Esports, dan kerja klien, tidur itu yang menjaga output tetap konsisten. Ritme berkelanjutan lebih baik daripada lembur heroik."
    ),
  },
  {
    id: "fridge",
    label: bi("Fridge — the engineering log", "Kulkas — log rekayasa"),
    action: bi("Open fridge", "Buka kulkas"),
    eyebrow: bi("Track record", "Rekam jejak"),
    body: bi(
      "Numbers I can point at: 15+ shipped projects, 3+ years of building, 9+ teams managed — and 3 first-place finishes plus 1 runner-up for the teams I lead in 2026, including two national titles.",
      "Angka yang bisa saya tunjukkan: 15+ proyek selesai, 3+ tahun membangun, 9+ tim dikelola — plus 3 juara pertama dan 1 runner-up untuk tim yang saya pimpin di 2026, termasuk dua gelar nasional."
    ),
    link: { label: bi("Read the experience timeline", "Baca timeline pengalaman"), href: "#experience" },
  },
  {
    id: "food",
    label: bi("Food & drink — fuel", "Makanan & minuman — bahan bakar"),
    action: bi("Eat food", "Makan"),
    eyebrow: bi("Routine", "Rutinitas"),
    body: bi(
      "Noodles, iced coffee, repeat. The small rituals that make long build sessions survivable — and a reminder that the best tools are the ones you actually use every day.",
      "Mie, es kopi, ulangi. Ritual kecil yang membuat sesi build panjang tetap bisa dijalani — sekaligus pengingat bahwa tool terbaik adalah yang benar-benar dipakai tiap hari."
    ),
  },
  {
    id: "plant",
    label: bi("Plants — the green corner", "Tanaman — sudut hijau"),
    action: bi("Water plants", "Siram tanaman"),
    eyebrow: bi("Nature", "Alam"),
    body: bi(
      "Same instinct as TinyWorld: low-poly worlds, living systems. A small nod to the procedural islands project — three islands, 26 interactive landmarks, a full day/night cycle in the browser.",
      "Naluri yang sama dengan TinyWorld: dunia low-poly, sistem yang hidup. Sedikit penghormatan ke proyek pulau prosedural — tiga pulau, 26 landmark interaktif, siklus siang/malam penuh di browser."
    ),
    link: { label: bi("Open TinyWorld demo", "Buka demo TinyWorld"), href: "https://zann06.github.io/TinyWorld/" },
  },
  {
    id: "backpack",
    label: bi("Backpack — what I carry", "Tas — yang saya bawa"),
    action: bi("Check bag", "Cek tas"),
    eyebrow: bi("Toolbox", "Kotak alat"),
    body: bi(
      "The stack that travels: React/Next.js, TypeScript, Tailwind, Node, Supabase/Postgres, Git, Figma — plus n8n for workflow automation and Python when something needs a quick script or Streamlit lab.",
      "Stack yang selalu dibawa: React/Next.js, TypeScript, Tailwind, Node, Supabase/Postgres, Git, Figma — plus n8n untuk otomasi workflow dan Python saat butuh skrip cepat atau lab Streamlit."
    ),
    tags: ["Frontend", "Backend", "Automation"],
  },
  {
    id: "accessories",
    label: bi("Gaming accessories — peripherals", "Aksesori gaming — periferal"),
    action: bi("Inspect gear", "Periksa gear"),
    eyebrow: bi("Setup", "Setup"),
    body: bi(
      "A long-time esports athlete builds habits around input latency. Same discipline applies to UI: perceived performance matters as much as the benchmark.",
      "Atlet esports sejak lama membangun kebiasaan soal input latency. Disiplin yang sama saya pakai di UI: performa yang terasa sama pentingnya dengan angka benchmark."
    ),
  },
  {
    id: "carpet",
    label: bi("Carpet — studio floor", "Karpet — lantai studio"),
    action: bi("Sit down", "Duduk"),
    eyebrow: bi("About", "Tentang"),
    body: bi(
      "Full-stack developer and UX researcher — building thoughtful digital products from web applications to data-driven platforms, with a bias toward things that ship and stay maintainable.",
      "Full-stack developer dan UX researcher — membangun produk digital yang thoughtful dari aplikasi web sampai platform berbasis data, dengan bias ke hal yang benar-benar rilis dan tetap mudah dirawat."
    ),
    link: { label: bi("More about me", "Selengkapnya tentang saya"), href: "#about" },
  },
]
