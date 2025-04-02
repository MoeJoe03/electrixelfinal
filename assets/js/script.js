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

/*******************************
 * PROJECT DETAILS POPUP CODE
 * Add this new section below all
 * your existing code
 *******************************/

const projectDetails = {
  "designing-a-better-cinema-experience": {
    description: "Full case study about improving cinema UX. We redesigned the ticket purchasing flow resulting in a 35% increase in customer satisfaction.",
    services: ["UX Design", "User Research", "Prototyping"]
  },
  "building-design-process-within-teams": {
    description: "Implemented agile design processes across 5 product teams, reducing production time by 40%.",
    services: ["Process Design", "Team Training"]
  },
  // Add details for other projects...
};

document.querySelectorAll('.project-card .btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const projectId = this.closest('.project-card').querySelector('img').alt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
      
    const project = projectDetails[projectId];
    if (!project) return;

    const popupHTML = `
      <div class="popup-overlay active">
        <div class="popup-content">
          <span class="close-popup">&times;</span>
          <h3 class="h3">${this.closest('.project-card').querySelector('.card-title').textContent}</h3>
          <p class="card-subtitle">${this.closest('.project-card').querySelector('.card-subtitle').textContent}</p>
          <p class="section-text">${project.description}</p>
          <div class="services-list">
            <h4 class="h4">Services:</h4>
            <ul>
              ${project.services.map(service => `<li>${service}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    document.querySelector('.popup-overlay').addEventListener('click', function(e) {
      if (e.target.classList.contains('popup-overlay') || e.target.classList.contains('close-popup')) {
        this.remove();
      }
    });
  });
});

// End of file - keep this comment