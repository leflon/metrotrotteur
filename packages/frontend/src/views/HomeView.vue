<script setup lang="ts">
import { User, Users } from "@lucide/vue";
</script>

<template>
  <div class="main-menu flex column center">
    <h1 class="logo">Métro Trotteur</h1>
    <div class="buttons flex column center">
      <router-link to="/solo" class="home-btn solo">
        <User />
        Solo
      </router-link>
      <router-link to="/multi" class="home-btn multi">
        <Users />
        Multijoueur
      </router-link>
    </div>
  <footer>
    <p>Créé par <a href='https://github.com/leflon' target='_blank'>Paul Leflon</a></p>
    <p>Illustrations par <a href='https://www.linkedin.com/in/youjinogsol/' target='_blank'>Youjin Jeong</a></p>
  </footer>
  </div>
</template>

<style scoped>
.main-menu {
  height: 100%;
}
.logo {
  font: bold 28pt "Parisine";
  position: relative;
  text-align: center;
  &:after {
    top: 0;
    content: "INDEV";
    font: bold 11pt monospace;
    background: #fcbb08;
    color: red;
    padding: 2px 4px;
    position: absolute;
    transform: rotate(22deg) translate(-30px, 5px);
  }
}
.solo {
  --color: #83c491;
}
.multi {
  --color: #f28e42;
}
.home-btn {
  width: 100%;
  font: bold 18pt "Parisine";
  padding: 12px 40px;
  color: #222;
  background: white;
  border: var(--border);
  border-radius: 12px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: 0.3s ease;

  &:hover {
    transform: scale(1.05);
    color: var(--color);
    border-color: var(--color);
    background: color-mix(in srgb, var(--color) 10%, white);
  }
  &:active {
    transform: scale(0.95);
  }

  &.disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }
}

footer {
  position: absolute;
  bottom: 10px;
  color: #000;
  text-align: center;
  opacity: .5;
  font-size: 9pt;

  & p {
    margin: 3px 0;
  }

  & a {
    color: inherit;
    &:hover {
      text-decoration: none;
    }
  }
}
</style>
