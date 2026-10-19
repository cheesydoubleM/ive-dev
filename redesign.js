(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const selectTab = (name, focus = false) => {
    const target = tabs.find(tab => tab.dataset.tab === name);
    if (!target) return;
    tabs.forEach(tab => {
      const active = tab === target;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) target.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next].dataset.tab, true);
      }
    });
  });
  document.querySelectorAll('[data-tour-link]').forEach(link => link.addEventListener('click', () => selectTab(link.dataset.tourLink)));
  const dialog = document.querySelector('.image-dialog');
  const image = dialog.querySelector('img');
  const caption = dialog.querySelector('#image-caption');
  let opener;
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    opener = button;
    image.src = button.dataset.zoom;
    image.alt = button.dataset.caption;
    caption.textContent = button.dataset.caption;
    dialog.showModal();
    document.body.classList.add('no-scroll');
    dialog.querySelector('.dialog-image-wrap').scrollTo(0, 0);
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('no-scroll');
    opener?.focus({ preventScroll: true });
  });
})();
