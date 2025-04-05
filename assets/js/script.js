'use strict';

/**
 * Utility function to add event listeners
 * @param {Element | NodeList | Window} elem - The element or elements to attach the event to
 * @param {string} type - The event type (e.g., 'click')
 * @param {Function} callback - The function to execute when the event triggers
 */
const addEventOnElements = function (elem, type, callback) {
  if (!elem) return; // Exit if element doesn't exist
  if (elem instanceof NodeList || Array.isArray(elem)) {
    elem.forEach(item => item.addEventListener(type, callback));
  } else {
    elem.addEventListener(type, callback);
  }
};

/**
 * Toggles mobile navigation menu
 */
const initMobileMenu = () => {
  const navbar = document.querySelector("[data-navbar]");
  const navToggler = document.querySelector("[data-nav-toggler]");
  const overlay = document.querySelector("[data-overlay]");
  const navLinks = document.querySelectorAll("[data-nav-link]");

  if (!navbar || !navToggler || !overlay) {
    console.warn("Mobile menu elements not found.");
    return; // Exit if essential elements are missing
  }

  const toggleMenu = () => {
    const isOpen = navbar.classList.toggle("active");
    navToggler.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("nav-active");
    navToggler.setAttribute('aria-expanded', isOpen.toString());

    // Accessibility: Trap focus within the menu when open
    if (isOpen) {
      // Logic to trap focus would go here (can be complex)
      // For simplicity, we'll just focus the first link
      const firstFocusable = navbar.querySelector('a[href], button:not([disabled])');
      firstFocusable?.focus();
    } else {
        // Return focus to the toggle button when closing
        navToggler.focus();
    }
  };

  // Toggle menu on button click
  addEventOnElements(navToggler, "click", toggleMenu);

  // Close menu on overlay click
  addEventOnElements(overlay, "click", toggleMenu);

  // Close menu on nav link click (for single-page navigation)
  addEventOnElements(navLinks, "click", () => {
    if (navbar.classList.contains("active")) {
      toggleMenu();
    }
  });

  // Close menu on 'Escape' key press
  const handleEscKey = (event) => {
    if (event.key === "Escape" && navbar.classList.contains("active")) {
      toggleMenu();
    }
  };
  document.addEventListener("keydown", handleEscKey);

  // Cleanup function (optional but good practice for SPAs)
  // window.addEventListener('beforeunload', () => {
  //   document.removeEventListener("keydown", handleEscKey);
  // });
};

/**
 * Adds 'active' class to header and back-to-top button when scrolling down
 */
const initHeaderAndScrollTop = () => {
  const header = document.querySelector("[data-header]");
  const backTopBtn = document.querySelector("[data-back-top-btn]");

  if (!header || !backTopBtn) {
    console.warn("Header or Back Top Button not found.");
    return;
  }

  const handleScroll = () => {
    if (window.scrollY > 100) {
      header.classList.add("active");
      backTopBtn.classList.add("active");
    } else {
      header.classList.remove("active");
      backTopBtn.classList.remove("active");
    }
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Initial check in case the page loads scrolled down
};

/**
 * Highlights the current page link in the navigation
 */
const highlightCurrentNavLink = () => {
    const navLinks = document.querySelectorAll('.navbar-link[data-nav-link]');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html'; // Get current file name

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop().split('#')[0]; // Get file name from link href

        // Simple check for home page (index.html or empty path) and other pages
        if (linkPath === currentPath || (currentPath === 'index.html' && link.getAttribute('href') === '#home')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
};


/**
 * Initializes Project Details Popup functionality
 */
const initProjectPopup = () => {
  // --- Project Data ---
  // Consider moving this to a separate JSON file or fetching it
  const projectDetails = {
    "designing-a-better-cinema-experience": {
      title: "Designing A Better Cinema Experience",
      description: "We focused on redesigning the online ticket purchasing flow to be more intuitive and user-friendly, incorporating user research and iterative testing.",
      services: ["UX Design", "User Research", "Prototyping", "Usability Testing"],
      images: ["./assets/images/project-1.jpg", "./assets/images/project-placeholder-1.png", "./assets/images/project-placeholder-2.png"] // Added placeholder images
    },
    "building-design-process": {
        title: "Building Design Process Within Teams",
        description: "Developed and implemented an agile workflow tailored for design teams, enhancing collaboration and efficiency. Included comprehensive team training sessions.",
        services: ["Process Design", "Agile Methodology", "Team Training", "Workflow Optimization"],
        images: ["./assets/images/project-2.jpg"]
    },
    "e-commerce-redesign": {
        title: "How Intercom Brings Play Into Their Design Process", // Title from HTML
        description: "A case study on redesigning an e-commerce platform, focusing on keyword targeting and improving the overall user journey for better conversion rates.",
        services: ["Keyword Targeting", "E-commerce Strategy", "UI/UX Design", "Conversion Rate Optimization"],
        images: ["./assets/images/project-3.jpg"]
    },
    "mobile-app-development": {
        title: "Stuck With To-Do List, I Created A New App For", // Title from HTML
        description: "Developed a new mobile application from concept to launch, focusing on intuitive task management features and leveraging targeted email marketing campaigns.",
        services: ["Mobile App Development", "UI/UX Design", "Email Marketing", "Feature Prioritization"],
        images: ["./assets/images/project-4.jpg"]
    },
    "examples-of-different-types-of-sprints": {
        title: "Examples Of Different Types Of Sprints", // Title from HTML
        description: "Analyzed and documented various sprint methodologies, providing clear examples and reporting frameworks to help teams choose the most effective approach.",
        services: ["Marketing & Reporting", "Agile Coaching", "Process Analysis", "Sprint Planning"],
        images: ["./assets/images/project-5.jpg"]
    },
    "redesigning-the-new-york-times-app": {
        title: "Redesigning The New York Times App", // Title from HTML
        description: "A conceptual project focused on redesigning a major news application, emphasizing improved navigation, content discovery, and cross-platform consistency.",
        services: ["Development", "UI/UX Redesign", "Conceptual Design", "Cross-Platform Strategy"],
        images: ["./assets/images/project-6.jpg"]
    }
    // Add other projects here...
  };

  const projectCards = document.querySelectorAll('.project-card');
  let activePopup = null; // To keep track of the currently open popup
  let focusedElementBeforePopup = null; // For accessibility

  const closePopup = () => {
    if (activePopup) {
      activePopup.classList.remove('active');
      // Allow transition before removing
      setTimeout(() => {
          activePopup.remove();
          activePopup = null;
          document.body.style.overflow = ''; // Restore body scroll
          if (focusedElementBeforePopup) {
            focusedElementBeforePopup.focus(); // Return focus
          }
      }, 300); // Match CSS transition duration
    }
  };

  projectCards.forEach(card => {
    const viewButton = card.querySelector('.btn-primary');
    const image = card.querySelector('img');
    const cardTitleElement = card.querySelector('.card-title');

    if (!viewButton || !image || !cardTitleElement) return;

    // Generate projectId from image alt text (simple conversion)
    const projectId = image.alt.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const project = projectDetails[projectId];

    if (!project) {
        console.warn(`Project details not found for ID: ${projectId}`);
        // Optionally disable or hide the button if details are missing
        // viewButton.style.display = 'none';
        return;
    }
    // Use title from data if available, otherwise fallback to card title
    const projectTitle = project.title || cardTitleElement.textContent.trim();

    viewButton.addEventListener('click', (e) => {
      e.preventDefault();
      focusedElementBeforePopup = document.activeElement; // Store current focus

      // Create popup structure
      const popupHTML = `
        <div class="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="popup-title-${projectId}">
          <div class="popup-content">
            <button class="close-popup" aria-label="Close dialog">&times;</button>
            <h3 id="popup-title-${projectId}">${projectTitle}</h3>
            ${project.images && project.images.length > 0 ? `
              <div class="image-gallery">
                ${project.images.map(img => `<img src="${img}" alt="${projectTitle} - Screenshot" class="popup-img" loading="lazy">`).join('')}
              </div>` : ''}
            <p>${project.description || 'No description available.'}</p>
            ${project.services && project.services.length > 0 ? `
              <div class="services">
                <h4>Services Provided:</h4>
                <ul>
                  ${project.services.map(service => `<li>${service}</li>`).join('')}
                </ul>
              </div>` : ''}
          </div>
        </div>
      `;

      // Add popup to body and activate
      document.body.insertAdjacentHTML('beforeend', popupHTML);
      activePopup = document.body.lastElementChild; // Get the newly added overlay

      // Short delay to allow element rendering before adding active class for transition
       setTimeout(() => {
            if(activePopup) {
                activePopup.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent body scroll

                // Focus the close button or the popup container for accessibility
                const closeBtn = activePopup.querySelector('.close-popup');
                closeBtn?.focus();
            }
      }, 10);


      // Event listeners for closing the popup
      const closeBtn = activePopup.querySelector('.close-popup');
      addEventOnElements(closeBtn, 'click', closePopup);
      activePopup.addEventListener('click', (event) => {
        // Close only if clicking the overlay itself, not the content
        if (event.target === activePopup) {
          closePopup();
        }
      });
    });
  });

    // Global listener for Escape key to close popup
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && activePopup) {
            closePopup();
        }
    });
};


/**
 * Handles form submissions using Formspree
 */
const initForms = () => {
  const forms = document.querySelectorAll('.contact-form[action*="formspree.io"]'); // Target Formspree forms

  forms.forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    const originalBtnText = submitBtn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Basic Check: Ensure required fields are not empty (HTML5 validation handles more)
      let isValid = form.checkValidity(); // Use built-in validation
      if (!isValid) {
          // Optionally highlight invalid fields or show a general message
          form.reportValidity(); // Trigger browser's validation UI
          return;
      }

      // Indicate submission
      submitBtn.disabled = true;
      submitBtn.innerHTML = `Sending... <span class="spinner" style="display: inline-block; width: 1em; height: 1em; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></span>`; // Basic inline spinner

      const formData = new FormData(form);
      const formAction = form.getAttribute('action');

      try {
        const response = await fetch(formAction, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          // Success! Replace form content
          form.innerHTML = `
            <div class="success-message">
              <ion-icon name="checkmark-circle-outline"></ion-icon> <h3>Thank You!</h3>
              <p>Your message has been sent successfully. We'll be in touch soon.</p>
              <a href="index.html" class="btn btn-primary" style="margin-top: 15px;">Back to Home</a>
            </div>
          `;
        } else {
            // Handle server errors (e.g., Formspree config issue)
            const responseData = await response.json();
             throw new Error(responseData.error || `Form submission failed (Status: ${response.status})`);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        // Display error message within the form area
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = `Submission failed: ${error.message || 'Please try again.'}`;
        form.appendChild(errorElement); // Append error message

        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText; // Restore original text (without spinner)

      }
    });

    // Optional: Clear custom error styling on input
    form.addEventListener('input', (e) => {
        if (e.target.hasAttribute('required')) {
            // Clear any custom styles you might add for errors
             e.target.style.borderColor = ''; // Example reset
        }
        // Remove error message if it exists
         const errorMsg = form.querySelector('.error-message');
         if (errorMsg) errorMsg.remove();
    });
  });

  // Add spinner animation CSS (if not already in style.css)
  if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
  }
};

/**
 * Initializes video functionality (Hero fallback, About play/pause)
 */
const initVideos = () => {
    // Hero Video Fallback
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        const fallbackImage = document.querySelector('.hero-media-container .img-cover');
        heroVideo.addEventListener('error', (e) => {
            console.warn('Hero video failed to load:', e);
            heroVideo.style.display = 'none';
            if (fallbackImage) {
                fallbackImage.style.display = 'block'; // Show fallback image
            }
        });
        // Ensure video plays inline on iOS
        heroVideo.setAttribute('playsinline', '');
    }

    // About Video Play/Pause Button
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
        const videoContainer = aboutSection.querySelector('.video-container');
        const video = videoContainer?.querySelector('video');
        const playBtn = videoContainer?.querySelector('.play-btn');
        const playIcon = playBtn?.querySelector('ion-icon');

        if (video && playBtn && playIcon) {
            // Start paused visually
            video.pause();
            playBtn.classList.remove('paused');
            playIcon.setAttribute('name', 'play');

            playBtn.addEventListener('click', () => {
                if (video.paused || video.ended) {
                    video.play();
                    playBtn.classList.add('paused'); // Indicate it's playing (button hides/changes)
                    playIcon.setAttribute('name', 'pause');
                    playBtn.setAttribute('aria-label', 'Pause video');
                } else {
                    video.pause();
                    playBtn.classList.remove('paused');
                    playIcon.setAttribute('name', 'play');
                     playBtn.setAttribute('aria-label', 'Play video');
                }
            });

             // Optional: Reset button when video ends
             video.addEventListener('ended', () => {
                 playBtn.classList.remove('paused');
                 playIcon.setAttribute('name', 'play');
                 playBtn.setAttribute('aria-label', 'Play video');
             });
        }
    }
};


/**
 * Updates the copyright year dynamically
 */
const updateCopyrightYear = () => {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
};

/**
 * Main application initialization function
 */
const initApp = () => {
  initMobileMenu();
  initHeaderAndScrollTop();
  highlightCurrentNavLink(); // Highlight nav link based on current page
  initProjectPopup();
  initForms();
  initVideos();
  updateCopyrightYear();

  console.log("Electrixel App Initialized");
};

// --- Initialize the App ---
// Run initialization after the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp(); // DOM is already loaded
}