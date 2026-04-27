(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  const form = document.querySelector(".contact-form");
  if (form) {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.classList.remove("error");
      status.textContent = "";

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email) {
        status.classList.add("error");
        status.textContent = "Please share your name and email so I can reach you.";
        return;
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        status.classList.add("error");
        status.textContent = "That email doesn't look quite right — mind double-checking?";
        return;
      }

      const subject = encodeURIComponent(`Trip Inquiry from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\n` +
          `Email: ${email}\n` +
          `Trip type: ${form["trip-type"].value}\n` +
          `Destination: ${form.destination.value || "(not specified)"}\n\n` +
          `${message || "(no additional details)"}`
      );
      window.location.href = `mailto:joanna@joannaelizabethtravel.com?subject=${subject}&body=${body}`;

      status.textContent = "Opening your email — thank you! I'll be in touch within one business day.";
      form.reset();
    });
  }
})();
