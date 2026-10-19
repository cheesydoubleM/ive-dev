(function () {
  'use strict';
  var form = document.querySelector('[data-waitlist-form]');
  if (!form) return;
  var status = document.querySelector('[data-waitlist-status]');
  var success = document.querySelector('[data-waitlist-success]');
  var button = form.querySelector('button[type="submit"]');
  var buttonLabel = form.querySelector('[data-waitlist-button-label]');
  var sentTo = document.querySelector('[data-waitlist-email-sent]');
  var edit = document.querySelector('[data-waitlist-edit]');
  var busy = false;

  if (edit) edit.addEventListener('click', function () {
    success.hidden = true;
    form.hidden = false;
    status.textContent = '';
    status.classList.remove('is-error');
    form.elements.email.focus();
    form.elements.email.select();
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    if (buttonLabel) buttonLabel.textContent = 'Sending…';
    status.textContent = 'Saving your place on the waitlist…';
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
      var result = await response.json().catch(function () { return {}; });
      // The service answers with fixed texts only, never with submitted data.
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'We couldn’t save your entry. Please try again.');
      if (sentTo) sentTo.textContent = form.elements.email.value.trim();
      status.textContent = '';
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
      if (buttonLabel) buttonLabel.textContent = 'Join the beta';
      form.removeAttribute('aria-busy');
    }
  });
})();
