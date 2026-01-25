<template>
  <main class="home">
    <div class="home__hero">
      <h1 class="home__title">Consome</h1>
      <p class="home__subtitle">Developer Console Community</p>
    </div>
  </main>
</template>

<style scoped>
.home {
  min-height: calc(100vh - var(--app-header-height, 60px));
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 40px 20px;
}

.home__hero {
  text-align: center;
}

.home__title {
  font-family: 'Outfit', sans-serif;
  font-size: 48px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  letter-spacing: -1px;
}

.home__subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  color: var(--accent);
  letter-spacing: 2px;
  text-transform: uppercase;
}
</style>
