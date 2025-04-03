'use strict';

/**
 * add event on element
 */
const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}

/**
 * MOBILE MENU TOGGLE
 */
const mobileMenu = () => {
  const navbar = document.querySelector("[data-navbar]");
  const navToggler = document.querySelector("[data-nav-toggler]");
  const overlay = document.querySelector("[data-overlay]");

  const toggleMenu = () => {
    navbar.classList.toggle("active");
    navToggler.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("nav-active");
  };

  // Close when clicking on nav links
  const navLinks = document.querySelectorAll("[data-nav-link]");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 991) {
        toggleMenu();
      }
    });
  });

  // Close when clicking overlay
  overlay.addEventListener("click", toggleMenu);

  // Toggle menu button
  navToggler.addEventListener("click", toggleMenu);

  // Close when pressing ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navbar.classList.contains("active")) {
      toggleMenu();
    }
  });
};

/**
 * toggle navbar (for desktop)
 */
const toggleNavbar = function () {
  navbar.classList.toggle("active");
  navToggler.classList.toggle("active");
}

addEventOnElem(navToggler, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  navToggler.classList.remove("active");
}

addEventOnElem(navbarLinks, "click", closeNavbar);

/**
 * header active
 */
const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

window.addEventListener("scroll", function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});

/**
 * Current page highlight
 */
document.querySelectorAll('.navbar-link').forEach(link => {
  if(link.href === window.location.href) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
});

/**
 * Project Details Popup
 */
const projectDetails = {
  "designing-a-better-cinema-experience": {
    description: "We redesigned the ticket purchasing flow...",
    services: ["UX Design", "User Research"],
    images: ["./assets/images/project-1.jpg"]
  },
  "building-design-process": {
    description: "Created an agile workflow for design teams...",
    services: ["Process Design", "Team Training"],
    images: ["./assets/images/project-2.jpg"]
  }
};

document.querySelectorAll('.project-card .btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const projectId = this.closest('.project-card')
      .querySelector('img').alt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
      
    const project = projectDetails[projectId];
    
    const popupHTML = `
    <div class="popup-overlay">
      <div class="popup-content">
        <span class="close-popup">&times;</span>
        <h3>${this.closest('.project-card').querySelector('.card-title').textContent}</h3>
        <div class="image-gallery">
          ${project.images.map(img => `<img src="${img}" class="popup-img">`).join('')}
        </div>
        <p>${project.description}</p>
        <div class="services">
          <h4>Services:</h4>
          <ul>
            ${project.services.map(service => `<li>${service}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    document.querySelector('.popup-overlay').addEventListener('click', function(e) {
      if (e.target.classList.contains('popup-overlay') || 
          e.target.classList.contains('close-popup')) {
        this.remove();
      }
    });
  });
});

/**
 * Form Handling
 */
const handleForms = () => {
  document.querySelectorAll('form').forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate
      let isValid = true;
      form.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = 'var(--red-crayola)';
          isValid = false;
        }
      });
      
      if (!isValid) return;

      // Submit
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending <span class="spinner"></span>';
      }

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          form.innerHTML = `
            <div class="success-message">
              <ion-icon name="checkmark-circle"></ion-icon>
              <h3>Thank You!</h3>
              <p>We'll contact you within 24 hours.</p>
              <a href="index.html" class="btn btn-primary">Back to Home</a>
            </div>
          `;
        }
      } catch (error) {
        alert('Error submitting form. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });

    // Clear validation on input
    form.addEventListener('input', (e) => {
      if (e.target.hasAttribute('required')) {
        e.target.style.borderColor = '';
        const errorMsg = e.target.nextElementSibling;
        if (errorMsg && errorMsg.classList.contains('error-message')) {
          errorMsg.remove();
        }
      }
    });
  });
};

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  mobileMenu();
  handleForms();
});