<template>
  <footer class="cv-footer">
    <div class="cv-footer-content">
      <p class="cv-footer-brand">📖 Cyber<span>Book</span></p>
      <p>© 2026 CyberBook - Red Team Playbook</p>
      <p class="cv-footer-note">
        Built with VitePress · Work in progress · For authorized testing and education only
      </p>
    </div>
  </footer>
</template>

<style scoped>
.cv-footer {
  margin-top: 72px;
  padding: 32px 24px 8px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  border-top: 1px solid transparent;
  border-image: linear-gradient(90deg, transparent, color-mix(in srgb, var(--cv-red) 50%, transparent), transparent) 1;
}

.cv-footer-content {
  max-width: 800px;
  margin: 0 auto;
}

.cv-footer p {
  margin: 4px 0;
  line-height: 1.6;
}

.cv-footer-brand {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.cv-footer-brand span {
  color: var(--cv-red);
}

.cv-footer-note {
  margin-top: 12px;
  font-size: 0.8rem;
  opacity: 0.6;
}
</style>
