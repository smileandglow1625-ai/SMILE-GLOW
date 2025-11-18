// =======================
// Mobile Menu Toggle
// =======================
const toggleBtn = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (toggleBtn && navLinks) {
  toggleBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// =======================
// Stats Section Animation
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll(".count");
  let started = false; // Run only once

  const animateCounters = () => {
    counters.forEach((counter) => {
      counter.innerText = "0";

      const updateCounter = () => {
        const target = +counter.getAttribute("data-target");
        const count = +counter.innerText;
        const speed = 100;
        const increment = target / speed;

        if (count < target) {
          counter.innerText = Math.ceil(count + increment);
          setTimeout(updateCounter, 25);
        } else {
          if (target >= 1000 && target < 10000) {
            counter.innerText = Math.round(target / 1000) + "K";
          } else if (target >= 10000) {
            counter.innerText = (target / 1000).toFixed(0) + "K";
          } else {
            counter.innerText = target + "+";
          }
        }
      };

      updateCounter();
    });
  };

  const checkScroll = () => {
    const section = document.querySelector(".stats-section");

    if (!section) return; // ❗ FIX: stop if section not found

    const sectionTop = section.getBoundingClientRect().top;
    const screenHeight = window.innerHeight;

    if (sectionTop < screenHeight - 100 && !started) {
      started = true;
      animateCounters();
    }
  };

  window.addEventListener("scroll", checkScroll);
  checkScroll();
});

// =======================
// FACTS — Accordion
// =======================
const accordions = document.querySelectorAll(".accordion-item");

accordions.forEach((item) => {
  const header = item.querySelector(".accordion-header");

  if (!header) return; // ❗ Safety check

  header.addEventListener("click", () => {
    item.classList.toggle("active");

    accordions.forEach((otherItem) => {
      if (otherItem !== item) otherItem.classList.remove("active");
    });
  });
});

// =======================
// Scroll-to-Top Button
// =======================
const scrollBtn = document.getElementById("scrollTopBtn");

if (scrollBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollBtn.style.display = "flex";
    } else {
      scrollBtn.style.display = "none";
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// =======================
// Appointment Form Submit
// =======================
const appointmentForm = document.getElementById("appointmentForm");

if (appointmentForm) {
  appointmentForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(
        "https://smile-glow-2.onrender.com/api/appointments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) throw new Error("Server Error");

      const result = await res.json();

      if (result.success) {
        alert("✅ Appointment Saved Successfully!");
        this.reset();
      } else {
        alert("❌ Something went wrong!");
      }
    } catch (error) {
      alert("⚠️ Unable to connect to server (CORS or Server Error).");
    }
  });
}
