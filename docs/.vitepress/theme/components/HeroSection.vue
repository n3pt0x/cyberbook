<template>
  <section class="cv-hero">
    <div class="cv-hero-content">
      <h1>📖 CyberBook</h1>
      <p class="subtitle">
        Cheatsheets · Notebook · Playbook <span class="separator">|</span> Red Team Ops
      </p>
    </div>
  </section>
</template>

<script setup></script>

<style scoped>
.cv-hero {
  padding: 80px 20px 40px;
  text-align: center;
  background: radial-gradient(
    circle at 50% 0%,
    rgba(220, 38, 38, 0.08),
    transparent 80%
  );
}

.cv-hero-content h1 {
  font-size: 3.2rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 1.3rem;
  margin-bottom: 24px;
  opacity: 0.9;
}

.separator {
  opacity: 0.4;
  margin: 0 10px;
}

.hero-badges {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}
</style>


