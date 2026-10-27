<template>
  <section class="cv-sections">
    <header class="cv-sections-head">
      <span class="cv-kicker">// sections</span>
      <h2>Browse by topic</h2>
      <p>From first recon to post-exploitation, one entry point per attack surface.</p>
    </header>

    <div class="cv-grid">
      <SectionCard
        v-for="(s, i) in sections"
        :key="s.slug"
        :index="i"
        :icon="s.icon"
        :title="s.title"
        :description="s.description"
        :children="data[s.slug]?.children ?? []"
        :accent="s.accent"
        :pages="data[s.slug]?.pages ?? 0"
        :href="data[s.slug]?.link ?? `/${s.slug}/`"
      />
    </div>
  </section>
</template>

<script setup>
import SectionCard from "./SectionCard.vue";
import { data } from "../data/sections.data.mts";

// Order follows a typical engagement flow. `slug` = root folder of docs/src/,
// `icon` = inner markup of a 24x24 stroke SVG (rendered by SectionCard),
// `accent` = one of the theme accents (themes.css), spread so that
// neighbouring cards never share a color in the 3 or 2 column grid
const sections = [
  {
    slug: "pentest-basics",
    icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>',
    title: "Pentest Basics",
    description: "Methodology, shells, payloads and the tooling every engagement starts with.",
    accent: "var(--cv-amber)",
  },
  {
    slug: "network",
    icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    title: "Network",
    description: "Recon, service-by-service pentesting, pivoting and traffic spoofing.",
    accent: "var(--cv-blue)",
  },
  {
    slug: "web-pentest",
    icon: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M10 13l-2 2 2 2M14 13l2 2-2 2"/>',
    title: "Web",
    description: "Injections, file inclusion, deserialization and server-side misconfigurations.",
    accent: "var(--cv-purple)",
  },
  {
    slug: "active-directory",
    icon: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"/>',
    title: "Active Directory",
    description: "Enumeration, Kerberos abuse, relays and credential dumping up to domain admin.",
    accent: "var(--cv-red)",
  },
  {
    slug: "windows",
    icon: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    title: "Windows",
    description: "Local privilege escalation and defense bypass on Windows hosts.",
    accent: "var(--cv-teal)",
  },
  {
    slug: "linux",
    icon: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 9l4 3-4 3M12 15h6"/>',
    title: "Linux",
    description: "Privilege escalation paths and post-exploitation on Linux systems.",
    accent: "var(--cv-green)",
  },
  {
    slug: "wifi",
    icon: '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.2a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
    title: "Wi-Fi",
    description: "WEP, WPS, WPA / WPA2, WPA3 and the attacks that go with each.",
    accent: "var(--cv-blue)",
  },
  {
    slug: "cryptography",
    icon: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2"/>',
    title: "Cryptography",
    description: "Hashing, cracking, certificates and the maths behind the locks.",
    accent: "var(--cv-purple)",
  },
  {
    slug: "exploit-development",
    icon: '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="M12 20v-9M9 4l1.5 2M15 4l-1.5 2M3 13h5M16 13h5M4 8l4 2M20 8l-4 2M4 19l4-2M20 19l-4-2"/>',
    title: "Exploit Dev",
    description: "Memory corruption fundamentals and writing reliable exploits.",
    accent: "var(--cv-red)",
  },
  {
    slug: "hardware-hacking",
    icon: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    title: "Hardware",
    description: "Physical access attacks and hardware-based implants.",
    accent: "var(--cv-amber)",
  },
];
</script>

<style scoped>
.cv-sections {
  max-width: 1152px;
  margin: 0 auto;
  padding: 24px 24px 0;
}

.cv-sections-head {
  margin-bottom: 28px;
  text-align: center;
}

.cv-kicker {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--cv-red);
}

.cv-sections-head h2 {
  margin: 6px 0 8px;
  padding: 0;
  border: 0;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.cv-sections-head p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.cv-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

/* 3 per row; an incomplete last row stays centered */
.cv-grid > .card {
  flex: 1 1 300px;
  max-width: calc((100% - 40px) / 3);
}

@media (max-width: 1050px) {
  .cv-grid > .card {
    max-width: calc((100% - 20px) / 2);
  }
}

@media (max-width: 680px) {
  .cv-grid > .card {
    max-width: 100%;
  }
}
</style>
