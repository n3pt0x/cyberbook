<template>
  <div class="cv-grid">
    <SectionCard
      icon="🔐"
      title="Cryptography"
      description="Encryption, hashing, PKI, and crypto attacks cheatsheets."
      href="/cryptography/"
      :is-active="true"
    />

    <SectionCard
      icon="🐧"
      title="Linux"
      description="Privesc, commands, persistence, and kernel exploits."
      href="/linux/"
      :is-active="false"
    />

    <SectionCard
      icon="🌐"
      title="Network"
      description="Protocols, pivoting, scanning, and traffic analysis."
      href="/network/"
      :is-active="false"
    />

    <SectionCard
      icon="🎯"
      title="Pentest Basic"
      description="Methodologies, reconnaissance, and exploitation basics."
      href="/pentest-basic/"
      :is-active="false"
    />

    <SectionCard
      icon="🕸️"
      title="Web"
      description="OWASP top 10, API pentesting, and client-side attacks."
      href="/web/"
      :is-active="false"
    />

    <SectionCard
      title="Windows"
      description="Active Directory, PowerShell, and Windows internals."
      href="/windows/"
      :is-active="false"
    />
  </div>
</template>

<script setup>
import SectionCard from "./SectionCard.vue";
</script>

<style scoped>
.cv-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin: 40px 0 20px;
  padding: 0 20px;
}

.construction-note {
  text-align: center;
  margin: 40px 0 20px;
  padding: 16px;
  background: rgba(220, 38, 38, 0.05);
  border-radius: 12px;
  border: 1px dashed rgba(220, 38, 38, 0.3);
  font-size: 0.95rem;
  opacity: 0.8;
}

.construction-note p {
  margin: 0;
}
</style>