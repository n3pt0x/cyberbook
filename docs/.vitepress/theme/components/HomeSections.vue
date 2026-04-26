<template>
  <div class="cv-grid">
    <SectionCard
      icon="🔐"
      title="Cryptography"
      description="Encryption, hashing, PKI, and crypto attacks cheatsheets."
      href="#"
      :is-active="true"
    />

    <SectionCard
      icon="🐧"
      title="Linux"
      description="Privesc, commands, persistence, and kernel exploits."
      href="#"
      :is-active="false"
    />

    <SectionCard
      icon="🌐"
      title="Network"
      description="Protocols, pivoting, scanning, and traffic analysis."
      href="#"
      :is-active="false"
    />
    
    <SectionCard
      icon="🛜"
      title="Wifi"
      description="WEP, WPS, WPA / WPA2, WPA3, Side-Channels."
      href="/wifi/"
      :is-active="false"
    />

    <SectionCard
      icon="🎯"
      title="Pentest Basic"
      description="Methodologies, reconnaissance, and exploitation basics."
      href="#"
      :is-active="false"
    />

    <SectionCard
      icon="🕸️"
      title="Web"
      description="OWASP top 10, API pentesting, and client-side attacks."
      href="#"
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