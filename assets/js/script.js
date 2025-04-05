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
 * Initializes the preloader animation
 */
const initPreloader = () => {
  const preloader = document.querySelector('.preloader');

  if (!preloader) {
    console.warn("Preloader element not found.");
    return;
  }

  // Add class to body to prevent scrolling while preloader is visible
  document.body.classList.add('preloader-active');

  window.addEventListener('load', () => {
    // Use a timeout to ensure the entry animation plays fully
    // and to give a minimum perceived load time. Adjust as needed.
    setTimeout(() => {
      if (preloader) { // Check if preloader still exists
        preloader.classList.add('loaded');
        document.body.classList.remove('preloader-active'); // Re-enable scroll

        // Optional: Remove the preloader from the DOM after the transition ends
        preloader.addEventListener('transitionend', (e) => {
          // Make sure it's the opacity transition on the preloader itself ending
          if (e.target === preloader && e.propertyName === 'opacity') {
             console.log("Preloader transition finished, removing element.");
             preloader.remove();
          }
        }, { once: true }); // Use { once: true } so listener cleans itself up
      }
    }, 500); // Minimum display time in milliseconds (e.g., 500ms)
  });

  // Fallback: If 'load' takes too long (e.g., > 10 seconds), hide loader anyway
  setTimeout(() => {
      if (preloader && !preloader.classList.contains('loaded')) { // Check existence again
          console.warn("Preloader forced hide due to timeout.");
          preloader.classList.add('loaded');
          document.body.classList.remove('preloader-active');
           // Optionally remove immediately or after short delay
           setTimeout(() => {
              if(preloader) preloader.remove(); // Final check before removal
           }, 1000);
      }
  }, 10000); // 10 seconds timeout
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

  // Close menu on nav link click (for single-page navigation or linking to index sections)
  addEventOnElements(navLinks, "click", () => {
    // Only close if the menu is active (visible)
    if (navbar.classList.contains("active")) {
        // Check if the link is to a different page or a hash link on the same page
        const linkHref = event.target.getAttribute('href');
        const isExternalOrDifferentPage = linkHref && !linkHref.startsWith('#') && !linkHref.startsWith(window.location.pathname + '#');
        const isSamePageHashLink = linkHref && linkHref.startsWith('#');

        // Close menu immediately for same-page hash links or if it's not a link click
        // If linking to a different page, the menu will close on page load anyway.
        if (isSamePageHashLink || !linkHref) {
             toggleMenu();
        }
        // If linking to different page sections from quote.html back to index.html, still close
        if (!isExternalOrDifferentPage && window.location.pathname.includes('quote.html')) {
            toggleMenu();
        }
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
    // Get current page filename (e.g., "index.html", "quote.html") or section ID
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const currentHash = window.location.hash; // e.g., "#about"

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        const linkPath = linkHref.split('#')[0]; // Get path part (e.g., "index.html", "quote.html", "")
        const linkHash = '#' + linkHref.split('#')[1]; // Get hash part (e.g., "#about")

        let isActive = false;

        // Check 1: Direct match for page (e.g., quote.html matches quote.html)
        if (linkPath && linkPath === currentPath) {
             // If on a specific page like quote.html, highlight the link *to* that page if it exists
             // For now, we don't have direct page links in nav, only section links or home
             isActive = true; // This might need refinement based on actual nav structure
        }

        // Check 2: Hash link match on the *same* page (e.g., on index.html, #about matches #about)
         if (linkHash && linkHash !== '#' && (!linkPath || linkPath === currentPath || linkPath === 'index.html') && linkHash === currentHash) {
           isActive = true;
         }

        // Check 3: Special case for "Home" link (#home or index.html) when on the root/index page without a hash
        if ((linkHref === '#home' || linkHref === 'index.html') && (currentPath === 'index.html' || currentPath === '') && !currentHash) {
           isActive = true;
         }
         // Check 4: If on quote.html, highlight the link that goes to that page (if one existed)
         // Currently, nav links point back to index.html sections.

        if (isActive) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
     // Listen for hash changes to update active link on same page navigation
     window.addEventListener('hashchange', highlightCurrentNavLink);
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
    "how-intercom-brings-play-into-their-design-process": { // Matches alt text better
        title: "How Intercom Brings Play Into Their Design Process", // Title from HTML
        description: "A case study on redesigning an e-commerce platform, focusing on keyword targeting and improving the overall user journey for better conversion rates.",
        services: ["Keyword Targeting", "E-commerce Strategy", "UI/UX Design", "Conversion Rate Optimization"],
        images: ["./assets/images/project-3.jpg"]
    },
    "stuck-with-to-do-list-i-created-a-new-app-for": { // Matches alt text
        title: "Stuck With To-Do List, I Created A New App For", // Title from HTML
        description: "Developed a new mobile application from concept to launch, focusing on intuitive task management features and leveraging targeted email marketing campaigns.",
        services: ["Mobile App Development", "UI/UX Design", "Email Marketing", "Feature Prioritization"],
        images: ["./assets/images/project-4.jpg"]
    },
    "examples-of-different-types-of-sprints": { // Matches alt text
        title: "Examples Of Different Types Of Sprints", // Title from HTML
        description: "Analyzed and documented various sprint methodologies, providing clear examples and reporting frameworks to help teams choose the most effective approach.",
        services: ["Marketing & Reporting", "Agile Coaching", "Process Analysis", "Sprint Planning"],
        images: ["./assets/images/project-5.jpg"]
    },
    "redesigning-the-new-york-times-app": { // Matches alt text
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
      document.body.style.overflow = ''; // Restore body scroll

      // Allow transition before removing
      activePopup.addEventListener('transitionend', () => {
           if (activePopup) activePopup.remove(); // Ensure it exists before removing
           activePopup = null;
           if (focusedElementBeforePopup) {
             focusedElementBeforePopup.focus(); // Return focus
           }
      }, { once: true });

       // Fallback removal if transitionend doesn't fire
        setTimeout(() => {
            if (activePopup) activePopup.remove();
             if (focusedElementBeforePopup) focusedElementBeforePopup.focus();
        }, 500); // Slightly longer than CSS transition

    }
  };

  projectCards.forEach(card => {
    const viewButton = card.querySelector('.btn-primary.view-details'); // More specific selector
    const image = card.querySelector('img');
    const cardTitleElement = card.querySelector('.card-title');

    if (!viewButton || !image || !cardTitleElement) return;

    // Generate projectId from image alt text (simple conversion)
    const projectId = image.alt.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const project = projectDetails[projectId];

    if (!project) {
        console.warn(`Project details not found for ID: ${projectId} (from alt: "${image.alt}")`);
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

      // --- Close any existing popup before opening a new one ---
       if (activePopup) {
           closePopup();
           // Wait a moment for the old one to start closing before adding the new one
           setTimeout(() => createAndShowPopup(popupHTML, projectId), 50);
       } else {
           createAndShowPopup(popupHTML, projectId);
       }

    });
  });

    const createAndShowPopup = (popupHTML, projectId) => {
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        activePopup = document.body.lastElementChild; // Get the newly added overlay

        // Short delay to allow element rendering before adding active class for transition
        requestAnimationFrame(() => { // Use requestAnimationFrame for smoother start
             if(activePopup) {
                 activePopup.classList.add('active');
                 document.body.style.overflow = 'hidden'; // Prevent body scroll

                 // Focus the close button or the popup container for accessibility
                 const closeBtn = activePopup.querySelector('.close-popup');
                 closeBtn?.focus();
             }
       });

        // Event listeners for closing the popup
        const closeBtn = activePopup.querySelector('.close-popup');
        addEventOnElements(closeBtn, 'click', closePopup);
        activePopup.addEventListener('click', (event) => {
            // Close only if clicking the overlay itself, not the content
            if (event.target === activePopup) {
            closePopup();
            }
        });
    };


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

      // Remove previous error messages
      const existingError = form.querySelector('.error-message');
      if (existingError) existingError.remove();

      // Basic Check: Ensure required fields are not empty (HTML5 validation handles more)
      let isValid = form.checkValidity(); // Use built-in validation
      if (!isValid) {
          // Optionally highlight invalid fields or show a general message
          form.reportValidity(); // Trigger browser's validation UI
          return;
      }

      // Indicate submission
      submitBtn.disabled = true;
      submitBtn.innerHTML = `Sending... <span class="spinner"></span>`; // Add spinner class

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
            const errorMessage = responseData.errors?.map(err => err.message).join(', ') || `Form submission failed (Status: ${response.status})`;
             throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        // Display error message within the form area
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = `Submission failed: ${error.message || 'Please try again.'}`;
        // Insert error before the submit button if possible, or append
         if (submitBtn) {
             form.insertBefore(errorElement, submitBtn);
         } else {
             form.appendChild(errorElement);
         }

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
         // Attempt to play muted video on load (browser policies might prevent this)
        heroVideo.play().catch(error => {
            console.warn("Hero video autoplay failed:", error);
            // Optional: Show controls or a play button overlay if autoplay fails
        });
    }

    // About Video Play/Pause Button
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
        const videoContainer = aboutSection.querySelector('.video-container');
        const video = videoContainer?.querySelector('video');
        const playBtn = videoContainer?.querySelector('.play-btn');
        const playIcon = playBtn?.querySelector('ion-icon');

        if (video && playBtn && playIcon) {
            // Ensure video starts muted and potentially paused visually if needed
            video.muted = true; // Ensure it's muted for potential autoplay
            video.loop = true; // Ensure loop attribute is set
            video.setAttribute('playsinline', ''); // Ensure playsinline

             // Set initial button state based on video state (though usually starts paused)
             if (video.paused) {
                 playBtn.classList.remove('paused');
                 playIcon.setAttribute('name', 'play');
                 playBtn.setAttribute('aria-label', 'Play video');
             } else {
                  playBtn.classList.add('paused');
                  playIcon.setAttribute('name', 'pause');
                  playBtn.setAttribute('aria-label', 'Pause video');
             }

            playBtn.addEventListener('click', () => {
                if (video.paused || video.ended) {
                    video.play().then(() => {
                         playBtn.classList.add('paused'); // Indicate it's playing
                         playIcon.setAttribute('name', 'pause');
                         playBtn.setAttribute('aria-label', 'Pause video');
                    }).catch(error => console.error("Video play failed:", error));
                } else {
                    video.pause();
                    playBtn.classList.remove('paused');
                    playIcon.setAttribute('name', 'play');
                    playBtn.setAttribute('aria-label', 'Play video');
                }
            });

             // Optional: Reset button when video ends (if not looping)
             if (!video.loop) {
                 video.addEventListener('ended', () => {
                     playBtn.classList.remove('paused');
                     playIcon.setAttribute('name', 'play');
                     playBtn.setAttribute('aria-label', 'Play video');
                 });
             }
             // Attempt to play initially (might be blocked by browser)
             video.play().catch(error => {
                 console.warn("About video initial autoplay failed:", error);
                 // Ensure button shows 'play' if autoplay failed
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
  initPreloader(); // Initialize the preloader first
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