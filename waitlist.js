(function () {
  'use strict';
  var form = document.querySelector('[data-waitlist-form]');
  if (!form) return;
  var status = document.querySelector('[data-waitlist-status]');
  var success = document.querySelector('[data-waitlist-success]');
  var button = form.querySelector('button[type="submit"]');
  var busy = false;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Adding you to the waitlist…';
    status.classList.remove('is-error');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          company: form.elements.company.value,
          consent: form.elements.consent.checked
        })
      });
      if (response.status === 429) throw new Error('Please wait a minute before trying again.');
      if (!response.ok) throw new Error('We couldn’t save your entry. Please try again.');
      var result = await response.json();
      if (result.ok !== true) throw new Error('We couldn’t save your entry. Please try again.');
      form.reset();
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (error) {
      status.classList.add('is-error');
      status.textContent = error.name === 'AbortError' || error instanceof TypeError
        ? 'The connection didn’t complete. Please try again — your email will only be added once.'
        : error.message;
    } finally {
      clearTimeout(timeout);
      busy = false;
      button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
})();
