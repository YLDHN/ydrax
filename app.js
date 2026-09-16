const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 30);
});

const navToggle = document.getElementById("navToggle");
const mobileMenu = document.getElementById("mobileMenu");

function setMenu(open) {
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  document.body.classList.toggle("menu-open", open);

  if (open) {
    mobileMenu.hidden = false;
    requestAnimationFrame(() => mobileMenu.classList.add("open"));
  } else {
    mobileMenu.classList.remove("open");
    setTimeout(() => {
      if (navToggle.getAttribute("aria-expanded") === "false") mobileMenu.hidden = true;
    }, 300);
  }
}

navToggle.addEventListener("click", () => {
  setMenu(navToggle.getAttribute("aria-expanded") !== "true");
});

mobileMenu.addEventListener("click", event => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    navToggle.focus();
  }
});

window.matchMedia("(min-width: 761px)").addEventListener("change", event => {
  if (event.matches) setMenu(false);
});

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: .12 }
);

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = [...document.querySelectorAll("main section[id]")];

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.remove("active"));
      const active = navLinks.find(
        link => link.getAttribute("href") === `#${entry.target.id}`
      );
      if (active) active.classList.add("active");
    });
  },
  { threshold: .45 }
);

sections.forEach(section => sectionObserver.observe(section));

/* CONTACT FORM */
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const notice = document.getElementById("contactNotice");
  const submit = document.getElementById("contactSubmit");
  const success = document.getElementById("contactSuccess");

  document.getElementById("contactAgain").addEventListener("click", () => {
    success.hidden = true;
    contactForm.hidden = false;
    contactForm.querySelector("input").focus();
  });
  const fields = {
    name: document.getElementById("cf-name"),
    email: document.getElementById("cf-email"),
    message: document.getElementById("cf-message"),
  };

  const isValid = {
    name: value => value.trim().length >= 2,
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),
    message: value => value.trim().length >= 10,
  };

  function validateField(key) {
    const input = fields[key].querySelector("input, textarea");
    const ok = isValid[key](input.value);
    fields[key].classList.toggle("invalid", !ok);
    return ok;
  }

  Object.keys(fields).forEach(key => {
    const input = fields[key].querySelector("input, textarea");
    input.addEventListener("blur", () => validateField(key));
    input.addEventListener("input", () => {
      if (fields[key].classList.contains("invalid")) validateField(key);
    });
  });

  function setNotice(type, text) {
    notice.innerHTML = text ? `<div class="${type}">${text}</div>` : "";
  }

  contactForm.addEventListener("submit", async event => {
    event.preventDefault();
    setNotice("", "");

    const allValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!allValid) {
      setNotice("err", "Merci de corriger les champs surlignés.");
      return;
    }

    const data = new FormData(contactForm);
    const original = submit.innerHTML;
    submit.disabled = true;
    submit.innerHTML = '<span class="form-spinner"></span> Envoi…';

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice("err", result.error || "L'envoi a échoué. Réessayez.");
        return;
      }

      contactForm.reset();
      setNotice("", "");
      contactForm.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      setNotice("err", "Connexion impossible. Écrivez-nous à contact.ydrax@gmail.com.");
    } finally {
      submit.disabled = false;
      submit.innerHTML = original;
    }
  });
}
