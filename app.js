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
