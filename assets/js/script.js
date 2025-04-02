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
 * toggle navbar
 */

const navbar = document.querySelector("[data-navbar]");
const navbarLinks = document.querySelectorAll("[data-nav-link]");
const navToggler = document.querySelector("[data-nav-toggler]");

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

// 1. Project Data - Add your project details here
const projectDetails = {
  // Existing project (keep this)
  "designing-a-better-cinema-experience": {
    description: "We redesigned the ticket purchasing flow...",
    services: ["UX Design", "User Research"],
    images: [
      "./assets/images/project-1.jpg",
      "./assets/images/cinema-process.jpg"
    ]
  },

  // ▼ Add new projects below ▼
  
  "building-design-process": {
    description: "Created an agile workflow for design teams, reducing project time by 30%.",
    services: ["Process Design", "Team Training"],
    images: [
      "./assets/images/project-2.jpg",
      "./assets/images/team-workshop.jpg"
    ]
  },

  "e-commerce-redesign": {
    description: "Redesigned checkout process increased conversions by 22%.",
    services: ["UI Design", "A/B Testing"],
    images: [
      "./assets/images/project-3.jpg",
      "./assets/images/checkout-flow.jpg",
      "./assets/images/mobile-version.jpg"
    ]
  },

  "mobile-app-development": {
    description: "Built a fitness app with 50k+ downloads in first month.",
    services: ["App Development", "UX Design"],
    images: [
      "./assets/images/project-4.jpg",
      "./assets/images/app-screens.jpg"
    ]
  }
  // Add more as needed...
};

// 2. Make "View Details" buttons work
document.querySelectorAll('.project-card .btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // 3. Get project ID from image alt text
    const projectId = this.closest('.project-card')
      .querySelector('img').alt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
      
    const project = projectDetails[projectId];
    
    // 4. Create popup HTML
    const popupHTML = `
    <div class="popup-overlay">
      <div class="popup-content">
        <span class="close-popup">&times;</span>
        <h3>${this.closest('.project-card').querySelector('.card-title').textContent}</h3>
        
        <div class="image-gallery">
          ${project.images.map(img => `
            <img src="${img}" class="popup-img">
          `).join('')}
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
    
    // 5. Add to page
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // 6. Close when clicking X or outside
    document.querySelector('.popup-overlay').addEventListener('click', function(e) {
      if (e.target.classList.contains('popup-overlay') || 
          e.target.classList.contains('close-popup')) {
        this.remove();
      }
    });
  });
});