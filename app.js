const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 30);
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
