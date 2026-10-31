/* Точка входа: запускаем интерфейс, подключаем возможности телефона */
(function () {
  'use strict';

  const cap = window.Capacitor;
  const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const P = (cap && cap.Plugins) || {};

  /* Внутри приложения Capacitor (Android/iOS). В обычном браузере ничего из этого не нужно. */
  function setupNative() {
    if (!native) return;
    // экран только вертикально
    try { if (P.ScreenOrientation) P.ScreenOrientation.lock({ orientation: 'portrait' }); } catch (e) { /* ок */ }
    // светлый текст статус-бара на тёмном фоне
    try {
      if (P.StatusBar) {
        P.StatusBar.setStyle({ style: 'DARK' });
        P.StatusBar.setOverlaysWebView({ overlay: true });
      }
    } catch (e) { /* ок */ }
    // кнопка «Назад» на Android: закрыть окно, вернуться на карту, а на карте нажать дважды для выхода
    try {
      if (P.App && P.App.addListener) {
        let last = 0;
        P.App.addListener('backButton', () => {
          if (G.handleBack() !== 'exit') return;
          const now = Date.now();
          if (now - last < 2000) P.App.exitApp();
          else { last = now; G.toast('Нажми «Назад» ещё раз, чтобы выйти'); }
        });
      }
    } catch (e) { /* ок */ }
  }

  /* Офлайн-режим для установки из браузера (PWA). В приложении файлы и так лежат внутри. */
  function registerWorker() {
    if (native || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* без офлайн-кэша игра всё равно работает */ });
    });
  }

  function start() {
    G.mg.trimChain();       // в цепочке остаются только подключённые игры «Тёмного леса»
    G.initUI();
    G.go('title');
    setupNative();
    if (G.art && G.art.warm) G.art.warm();     // фоном рисуем текстуры и надгробия
  }

  registerWorker();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
