'use strict';

/**
 * Utility function to add event listeners efficiently to one or more elements.
 * @param {Element | NodeList | Window} elements - The element, NodeList, or window to attach the event to.
 * @param {string} eventType - The event type string (e.g., 'click').
 * @param {Function} callback - The function to execute when the event triggers.
 */
const addEventOnElements = function (elements, eventType, callback) {
    if (!elements) return; // Exit if elements don't exist

    if (elements instanceof NodeList || Array.isArray(elements)) {
        elements.forEach(element => element.addEventListener(eventType, callback));
    } else {
        elements.addEventListener(eventType, callback);
    }
};

/**
 * Initializes the preloader: handles its display, fade-out animation,
 * and removal from the DOM. Also triggers hero visibility.
 * **UPDATED TIMING FOR MULTI-STAGE ANIMATION**
 */
const initPreloader = () => {
     // Use data attribute selector from new HTML (or '.preloader' if you didn't add data-preloader)
     const preloader = document.querySelector('[data-preloader]') || document.querySelector('.preloader');
     const heroSection = document.querySelector('.hero'); // Still useful for hero visibility if needed
 
     if (!preloader) {
         console.warn("Preloader element not found.");
         // document.body.classList.remove('preloader-active');
         return;
     }
 
     document.body.classList.add('preloader-active');
 
     window.addEventListener('load', () => {
         // --- ADJUSTED TIMEOUT ---
         // Wait slightly less than the final CSS transition-delay (which was 3.0s in example)
         // to allow CSS animations (logo zoom, blue wipe, black wipe) to finish first.
         setTimeout(() => {
             if (preloader) {
                 preloader.classList.add('loaded'); // Trigger final fade-out via CSS transition
                 document.body.classList.remove('preloader-active'); // Allow scroll
 
// Optional: Remove element slightly after hiding for cleanup,
                // since transitionend won't fire reliably with duration 0.
                setTimeout(() => {
                    if(preloader) preloader.remove();
                }, 50); // Short delay after hiding

            }
        }, 2600); // <-- *** UPDATED DELAY TO MATCH ANIMATION END ***
        // ------------------------
    });

// Fallback timeout remains useful
    setTimeout(() => {
        if (preloader && !preloader.classList.contains('loaded')) {
            console.warn("Preloader forced hide due to fallback timeout (10s).");
            preloader.classList.add('loaded');
            document.body.classList.remove('preloader-active');
            if (heroSection && !heroSection.classList.contains('hero-visible')) {
                 heroSection.classList.add('hero-visible');
             }
             // Force remove if fallback triggered
             setTimeout(() => { if (preloader) preloader.remove(); }, 50);
        }
    }, 10000);
 };

/**
 * Initializes the mobile navigation menu toggle functionality.
 */
const initMobileMenu = () => {
    const navbar = document.querySelector("[data-navbar]");
    const navToggler = document.querySelector("[data-nav-toggler]");
    const overlay = document.querySelector("[data-overlay]");
    const navLinks = document.querySelectorAll("[data-nav-link]");

    if (!navbar || !navToggler || !overlay) {
        console.warn("Mobile menu component(s) not found (requires elements with [data-navbar], [data-nav-toggler], [data-overlay]).");
        return;
    }

    const toggleMenu = () => {
        const isOpen = navbar.classList.toggle("active");
        navToggler.classList.toggle("active");
        overlay.classList.toggle("active");
        document.body.classList.toggle("nav-active"); // Prevent body scroll when menu is open
        navToggler.setAttribute('aria-expanded', isOpen.toString());

        if (isOpen) {
            // Move focus to the first focusable element in the menu when opened
            const firstFocusable = navbar.querySelector('a[href], button:not([disabled])');
            firstFocusable?.focus(); // Optional chaining: only focus if found
        } else {
            // Return focus to the toggle button when the menu is closed
            navToggler?.focus();
        }
    };

    // Event listeners for toggling the menu
    addEventOnElements(navToggler, "click", toggleMenu);
    addEventOnElements(overlay, "click", toggleMenu);

    // Close menu when a navigation link is clicked (if it's a same-page link)
    addEventOnElements(navLinks, "click", (event) => {
        if (navbar.classList.contains("active")) {
            const linkHref = event.target.getAttribute('href');
            const currentPath = window.location.pathname;
            const isOnQuotePage = currentPath.includes('quote.html');
            const isLinkToIndexSection = linkHref?.includes('index.html#');
            const isSamePageHashLink = linkHref?.startsWith('#');

            // Close menu only for links navigating within the current page context
            if (isSamePageHashLink || (isOnQuotePage && isLinkToIndexSection)) {
                toggleMenu();
            }
            // External links or links to different pages will close implicitly via page load.
        }
    });

    // Close menu on Escape key press
    const handleEscKey = (event) => {
        if (event.key === "Escape" && navbar.classList.contains("active")) {
            toggleMenu();
        }
    };
    document.addEventListener("keydown", handleEscKey);
};

/**
 * Adds 'active' class to header and back-to-top button when scrolling down.
 */
const initHeaderAndScrollTop = () => {
    const header = document.querySelector("[data-header]");
    const backTopBtn = document.querySelector("[data-back-top-btn]");

    if (!header && !backTopBtn) {
        // Don't warn if neither exists, maybe it's intentional
        return;
    }

    let isTicking = false; // Use requestAnimationFrame for performance

    const handleScroll = () => {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                if (header) {
                    header.classList.toggle("active", scrollY > 100);
                }
                if (backTopBtn) {
                    backTopBtn.classList.toggle("active", scrollY > 100);
                }
                isTicking = false;
            });
            isTicking = true;
        }
    };

    window.addEventListener("scroll", handleScroll, { passive: true }); // Improve scroll performance
    // Initial check in case the page loads already scrolled
    handleScroll();
};

/**
 * Initializes scroll-hijacking control for the 3D CSS carousel.
 * Stops page scroll when the section is active and controls carousel instead.
 * Includes Touch (Horizontal Swipe), Keyboard, and Arrow Button support.
 */
const initScrollHijackCarousel = () => {
     const carousel = document.getElementById('carousel');
     const projectSection = document.getElementById('project');
     const prevBtn = document.getElementById('carousel-prev-btn');
     const nextBtn = document.getElementById('carousel-next-btn');
 
     if (!carousel || !projectSection || !prevBtn || !nextBtn) {
         console.warn('Scroll hijack carousel elements not found (#carousel, #project, buttons).');
         return;
     }
 
     // --- Configuration ---
     const activationThreshold = 0.6;
     const throttleDelay = 500;
     const touchThresholdX = 50; // Min HORIZONTAL swipe pixels to trigger change
     // ---------------------
 
     let numItems = 6;
     try {
         const itemsVar = getComputedStyle(carousel).getPropertyValue('--items').trim();
         const parsedItems = parseInt(itemsVar, 10);
         if (!isNaN(parsedItems) && parsedItems > 0) numItems = parsedItems;
     } catch(e) { /* use default */ }
 
     let isLocked = false;
     let isThrottled = false;
     let currentPosition = 1;
     let touchStartX = null; // Track touch start X position
     let touchStartY = null; // Track touch start Y position (for comparing swipe axis)
 
     // --- Helper function to update button disabled states ---
     const updateButtonStates = () => {
         if (!prevBtn || !nextBtn) return;
         prevBtn.classList.toggle('disabled', currentPosition === 1);
         nextBtn.classList.toggle('disabled', currentPosition === numItems);
         prevBtn.setAttribute('aria-disabled', (currentPosition === 1).toString());
         nextBtn.setAttribute('aria-disabled', (currentPosition === numItems).toString());
     };
 
     // --- Helper function to update position ---
     const updatePosition = (newPosition) => {
         if (newPosition >= 1 && newPosition <= numItems && newPosition !== currentPosition) {
             currentPosition = newPosition;
             if(document.body.contains(carousel)) {
                 carousel.style.setProperty('--position', currentPosition);
             }
             updateButtonStates(); // Update buttons after position changes
             isThrottled = true;
             setTimeout(() => { isThrottled = false; }, throttleDelay);
             return true; // Indicate change happened
         }
         return false; // No change
     };
 
     // --- Intersection Observer ---
     const observerCallback = (entries) => { entries.forEach(entry => { isLocked = entry.isIntersecting && entry.intersectionRatio >= activationThreshold; if (!isLocked) isThrottled = false; }); };
     const observerOptions = { root: null, threshold: activationThreshold };
     const observer = new IntersectionObserver(observerCallback, observerOptions);
     observer.observe(projectSection);
 
     // --- Wheel Event Handler ---
     const handleWheel = (event) => {
         if (!isLocked || isThrottled) return;
         const scrollDirection = event.deltaY;
         let positionChanged = false;
         if (scrollDirection > 0) { positionChanged = updatePosition(currentPosition + 1); }
         else if (scrollDirection < 0) { positionChanged = updatePosition(currentPosition - 1); }
         if (positionChanged) event.preventDefault();
     };
 
     // --- MODIFIED Touch Event Handlers for Horizontal Swipe ---
     const handleTouchStart = (event) => {
         if (!isLocked || event.touches.length !== 1) return; // Only handle single touch
         touchStartX = event.touches[0].clientX;
         touchStartY = event.touches[0].clientY;
     };
 
     const handleTouchMove = (event) => {
         // Prevent vertical scroll WHILE swiping horizontally if section is locked
         // This might need adjustment depending on desired feel vs interfering with vertical page scroll
         if (!isLocked || !touchStartX || !touchStartY) return;
 
         const touchCurrentX = event.touches[0].clientX;
         const touchCurrentY = event.touches[0].clientY;
         const deltaX = Math.abs(touchCurrentX - touchStartX);
         const deltaY = Math.abs(touchCurrentY - touchStartY);
 
         // If horizontal movement is dominant, prevent vertical scroll
         if (deltaX > deltaY) {
             event.preventDefault();
         }
         // If vertical is dominant, allow default vertical scroll (reset start coords?)
         // else {
         //     touchStartX = null; // Optional: allow vertical scroll to take over if dominant
         //     touchStartY = null;
         // }
     };
 
     const handleTouchEnd = (event) => {
         if (!isLocked || isThrottled || !touchStartX || !touchStartY || event.changedTouches.length !== 1) {
              // Reset if touch ended unexpectedly or conditions not met
              touchStartX = null;
              touchStartY = null;
              return;
         }
 
         const touchEndX = event.changedTouches[0].clientX;
         const touchEndY = event.changedTouches[0].clientY;
 
         const deltaX = touchEndX - touchStartX; // Positive for swipe right, negative for swipe left
         const deltaY = touchEndY - touchStartY;
 
         // Check if swipe was primarily horizontal and exceeded threshold
         if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > touchThresholdX) {
             if (deltaX < 0) { // Swipe Left -> Next Card
                 updatePosition(currentPosition + 1);
             } else { // Swipe Right -> Previous Card
                 updatePosition(currentPosition - 1);
             }
         }
         // Reset touch start positions
         touchStartX = null;
         touchStartY = null;
     };
     // --- End of Modified Touch Handlers ---
 
     // --- Keyboard Event Handler ---
     const handleKeyDown = (event) => {
         const targetTagName = event.target.tagName.toLowerCase();
         if (['input', 'textarea', 'select'].includes(targetTagName) || !isLocked || isThrottled) return;
         let newPosition = currentPosition; let shouldPreventDefault = false;
         switch (event.key) {
             case 'ArrowRight': case 'ArrowDown':
                 if (currentPosition < numItems) { newPosition++; shouldPreventDefault = true; } break;
             case 'ArrowLeft': case 'ArrowUp':
                 if (currentPosition > 1) { newPosition--; shouldPreventDefault = true; } break;
             // Allow PageUp/PageDown default behavior for faster scrolling through page? Optional.
             // case 'PageDown': if (currentPosition < numItems) { newPosition++; shouldPreventDefault = true; } break;
             // case 'PageUp': if (currentPosition > 1) { newPosition--; shouldPreventDefault = true; } break;
             default: return;
         }
         if (shouldPreventDefault) { event.preventDefault(); updatePosition(newPosition); }
     };
 
     // --- Add Click Listeners for Buttons ---
     prevBtn.addEventListener('click', () => { if (!isThrottled) { updatePosition(currentPosition - 1); } });
     nextBtn.addEventListener('click', () => { if (!isThrottled) { updatePosition(currentPosition + 1); } });
 
     // --- Add All Event Listeners ---
     window.addEventListener('wheel', handleWheel, { passive: false });
     window.addEventListener('touchstart', handleTouchStart, { passive: true });
     window.addEventListener('touchmove', handleTouchMove, { passive: false });
     window.addEventListener('touchend', handleTouchEnd, { passive: true });
     window.addEventListener('keydown', handleKeyDown);
 
     // --- Initial State & Resize ---
     try { const initialPos = parseInt(getComputedStyle(carousel).getPropertyValue('--position').trim(), 10); if(!isNaN(initialPos)) currentPosition = initialPos; } catch(e) { /* Use default */ }
     if(document.body.contains(carousel)) { carousel.style.setProperty('--position', currentPosition); }
     const calculateDimensions = () => { sectionTop = projectSection.offsetTop; sectionHeight = projectSection.offsetHeight; };
     setTimeout(() => { calculateDimensions(); updateButtonStates(); }, 100);
     window.addEventListener('resize', () => {
         clearTimeout(window.resizeTimeout);
         window.resizeTimeout = setTimeout(() => { if (typeof calculateDimensions === 'function') calculateDimensions(); updateButtonStates(); }, 250);
     });
 
 }; // End initScrollHijackCarousel

 // ==================================================
// NEW FUNCTION: Service Section Horizontal Scroll
// ==================================================
/**
 * Initializes the horizontal scroll effect for the Services section.
 * Translates the .service-track based on vertical scroll progress
 * while the .sticky-container is sticky.
 */
const initServiceHorizontalScroll = () => {
     const scrollWrapper = document.querySelector('.horizontal-scroll-wrapper');
     const stickyContainer = scrollWrapper?.querySelector('.sticky-container');
     const serviceTrack = stickyContainer?.querySelector('.service-track');
 
     // Exit if necessary elements aren't found
     if (!scrollWrapper || !stickyContainer || !serviceTrack) {
         console.warn('Horizontal scroll elements not found for Services section (#service .horizontal-scroll-wrapper > .sticky-container > .service-track).');
         return;
     }
 
     let wrapperTop = 0;
     let wrapperHeight = 0;
     let trackWidth = 0;
     let maxTranslateX = 0;
     let stickyTop = 0; // The 'top' value from CSS where the container sticks
     let isTicking = false;
 
     // Function to calculate dimensions and max scroll distance
     const calculateDimensions = () => {
         wrapperTop = scrollWrapper.offsetTop;
         wrapperHeight = scrollWrapper.offsetHeight;
         trackWidth = serviceTrack.scrollWidth; // Actual width of the flex track
         stickyTop = parseInt(window.getComputedStyle(stickyContainer).top) || 0; // Read sticky top value
         // Max distance the track needs to move left = its total width minus one viewport width
         maxTranslateX = trackWidth - window.innerWidth;
     };
 
     // Function to update track position based on scroll
     const updateTrackPosition = () => {
          const scrollY = window.scrollY;
          // Calculate the scroll range where the sticky container is physically active
          const stickyStartScrollY = wrapperTop - stickyTop;
          const stickyEndScrollY = wrapperTop + wrapperHeight - window.innerHeight - stickyTop;
  
          // --- MODIFICATION START: Adjust when the horizontal scroll progress BEGINS ---
          // Add a delay before progress starts counting.
          // Example: Start progress calculation only after scrolling 1/4th of the viewport height PAST the sticky start point.
          // Adjust the multiplier (0.25) or use a fixed pixel value if preferred.
          const progressStartScrollY = stickyStartScrollY + (window.innerHeight * 0.25); // <-- Adjust 0.25 to change start point
          // The progress calculation should now happen between progressStartScrollY and stickyEndScrollY
          const progressScrollRange = stickyEndScrollY - progressStartScrollY;
          // --- MODIFICATION END ---
  
          let currentTranslateX = 0;
          let progress = 0; // Initialize progress
  
          if (scrollY <= progressStartScrollY) {
               // Before the adjusted progress start point
               currentTranslateX = 0;
               progress = 0;
          } else if (scrollY >= stickyEndScrollY) {
               // After sticky ends (ensure full translation)
               currentTranslateX = -maxTranslateX;
               progress = 1;
          } else {
               // Within the adjusted progress range
               const scrollDistance = scrollY - progressStartScrollY;
               // Calculate progress (0 to 1) within the NEW scroll range
               progress = (progressScrollRange > 0) ? Math.max(0, Math.min(1, scrollDistance / progressScrollRange)) : 0; // Clamp progress 0-1
               // Calculate horizontal translation based on progress
               currentTranslateX = -progress * maxTranslateX;
          }
  
           // Apply the transform using requestAnimationFrame
           if (!isTicking) {
               window.requestAnimationFrame(() => {
                   if (document.body.contains(serviceTrack)) { // Check element still exists
                       serviceTrack.style.transform = `translateX(${currentTranslateX.toFixed(2)}px)`;
                   }
                   isTicking = false;
               });
               isTicking = true;
           }
      };
      // +++ END OF NEW VERSION TO PASTE +++++++++++++++++++++++++++++++
 
     // --- Initial Setup & Listeners ---
 
     // Calculate initial dimensions after a short delay for layout stability
     let initialCalcTimeout = setTimeout( () => {
         calculateDimensions();
         updateTrackPosition(); // Initial position update
     }, 150); // Increased delay slightly
 
     // Update on scroll
     window.addEventListener('scroll', updateTrackPosition, { passive: true });
 
     // Recalculate on resize (use debounce)
     let resizeTimeout;
     window.addEventListener('resize', () => {
         clearTimeout(resizeTimeout);
         // Clear initial calc timeout if resize happens quickly
         clearTimeout(initialCalcTimeout);
         resizeTimeout = setTimeout(() => {
             calculateDimensions();
             updateTrackPosition(); // Update immediately after recalc
         }, 250);
     });
 
 }; // End initServiceHorizontalScroll
 // ==================================================
 // END OF NEW FUNCTION DEFINITION
 // ==================================================

/**
 * Highlights the current navigation link based on URL path and hash.
 */
const highlightCurrentNavLink = () => {
    const navLinks = document.querySelectorAll('.navbar-link[data-nav-link]');
    if (!navLinks || navLinks.length === 0) return;

    let currentPath = window.location.pathname.split('/').pop() || 'index.html'; // Default to index.html
    const currentHash = window.location.hash;

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return;

        const linkUrl = new URL(linkHref, window.location.href); // Resolve relative URLs
        let linkPath = linkUrl.pathname.split('/').pop() || 'index.html';
        const linkHash = linkUrl.hash;

        let isActive = false;

        // Match if paths are the same AND (hashes match OR neither has a hash)
        if (linkPath === currentPath && linkHash === currentHash) {
            isActive = true;
        }
        // Special case: "Home" link (#home or index.html) active on index.html root
        else if (currentPath === 'index.html' && !currentHash && (linkHref === '#home' || (linkPath === 'index.html' && !linkHash))) {
             isActive = true;
        }

        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
};


/**
 * Handles AJAX form submissions using Formspree.
 */
const initForms = () => {
    // IMPORTANT: Ensure the 'action' attribute in your HTML forms points to your correct Formspree endpoint.
    const forms = document.querySelectorAll('form[action*="formspree.io"]');

    forms.forEach(form => {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const originalBtnText = submitBtn.textContent;
        let formWrapper = form.parentElement; // Assume form is direct child of its container for messages

        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default browser submission

            // Clear previous status messages within this form's context
            formWrapper?.querySelector('.error-message')?.remove();
            formWrapper?.querySelector('.success-message')?.remove();


            // --- Custom Validation for Quote Form Checkboxes ---
            let customValidationPassed = true;
            if (form.classList.contains('quote-form')) {
                const servicesCheckboxes = form.querySelectorAll('input[name="service_needed[]"]');
                if (servicesCheckboxes.length > 0) {
                    const isServiceChecked = Array.from(servicesCheckboxes).some(checkbox => checkbox.checked);
                    if (!isServiceChecked) {
                        displayFormMessage(form, 'Please select at least one service.', 'error');
                        customValidationPassed = false;
                    }
                }
            }
             // --- End Custom Validation ---

            // Check basic HTML5 validation AFTER custom checks
             if (!form.checkValidity() || !customValidationPassed) {
                 if (!customValidationPassed) {
                    // Focus the first checkbox if that was the error
                     form.querySelector('input[name="service_needed[]"]')?.focus();
                 } else {
                    // Trigger browser's default validation UI for other errors
                    form.reportValidity();
                 }
                 return; // Stop submission if invalid
             }


            // Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `Sending... <span class="spinner" role="status" aria-hidden="true"></span>`;

            const formData = new FormData(form);
            const formAction = form.getAttribute('action');

            try {
                const response = await fetch(formAction, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' } // Required for Formspree AJAX
                });

                if (response.ok) {
                    // Success: Replace form content with success message
                    const successMessageHTML = `
                        <div class="success-message" role="alert">
                          <ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon>
                          <h3>Thank You!</h3>
                          <p>Your message has been sent successfully. We'll be in touch soon.</p>
                          <a href="index.html" class="btn btn-primary" style="margin-top: 15px;">Back to Home</a>
                        </div>`;
                    form.innerHTML = successMessageHTML; // Replace form content
                    form.parentElement.querySelector('.form-subtitle')?.remove(); // Clean up subtitles if any
                    form.parentElement.querySelector('.form-label')?.remove(); // Clean up labels if any

                } else {
                    // Handle server-side errors from Formspree
                    const responseData = await response.json();
                    const errorMessage = responseData.errors?.map(err => `${err.field}: ${err.message}`).join(', ')
                                       || `Submission failed (Status: ${response.status})`;
                    throw new Error(errorMessage);
                }

            } catch (error) {
                console.error("Form submission error:", error);
                displayFormMessage(form, `Submission failed: ${error.message || 'Please check your connection and try again.'}`, 'error');

                // Re-enable the button and restore original text on error
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });

         // Optional: Clear general error messages on form input
         form.addEventListener('input', () => {
             formWrapper?.querySelector('.error-message')?.remove();
         });
    });

    // Helper to display messages consistently
    const displayFormMessage = (formElement, message, type = 'error') => {
         const messageElement = document.createElement('div');
         messageElement.className = `${type}-message`; // Assumes '.error-message' or '.success-message' class exists
         messageElement.textContent = message;
         messageElement.setAttribute('role', 'alert');
         // Insert message before the form itself, assuming form is inside a wrapper
         formElement.parentNode.insertBefore(messageElement, formElement);
    };
};


/**
 * Initializes video functionality: Hero fallback and About play/pause controls.
 */
const initVideos = () => {
    // --- Hero Video ---
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
        const fallbackImage = document.querySelector('.hero-media-container .img-cover');
        heroVideo.addEventListener('error', (e) => {
            console.warn('Hero video failed to load. Displaying fallback image.', e);
            heroVideo.style.display = 'none';
            if (fallbackImage) fallbackImage.style.display = 'block';
        });
        heroVideo.setAttribute('playsinline', ''); // Essential for iOS inline playback
        heroVideo.play().catch(error => {
            // Autoplay is often blocked, especially on mobile. This is expected.
            // console.warn("Hero video autoplay failed (browser policy likely):", error);
        });
    }

    // --- About Video ---
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
        const videoContainer = aboutSection.querySelector('.video-container');
        const video = videoContainer?.querySelector('video');
        const playBtn = videoContainer?.querySelector('.play-btn');
        const playIcon = playBtn?.querySelector('ion-icon');

        if (video && playBtn && playIcon) {
            video.muted = true; // Mute for background/autoplay behavior
            video.loop = true;
            video.setAttribute('playsinline', '');

            const updateButtonState = () => {
                if (!video || !playBtn || !playIcon) return;
                const isPaused = video.paused || video.ended;
                playBtn.classList.toggle('paused', !isPaused);
                playIcon.setAttribute('name', isPaused ? 'play' : 'pause');
                playBtn.setAttribute('aria-label', isPaused ? 'Play video' : 'Pause video');
            };

            playBtn.addEventListener('click', () => {
                if (video.paused || video.ended) {
                    video.play().catch(error => console.error("About video play failed:", error));
                } else {
                    video.pause();
                }
            });

            // Update button state based on video events
            video.addEventListener('play', updateButtonState);
            video.addEventListener('pause', updateButtonState);
            video.addEventListener('ended', updateButtonState); // In case loop=false is set later

            // Attempt initial play and set initial button state
            video.play().catch(error => {
                // console.warn("About video autoplay failed:", error);
                updateButtonState(); // Ensure button shows 'play' if autoplay fails
            });
            updateButtonState(); // Set initial state reliably
        }
    }
};

/**
 * Initializes Intersection Observer for scroll-triggered animations.
 */
const initScrollAnimations = () => {
    // IMPORTANT: This requires corresponding CSS rules for the '.in-view' class
    // to define the target state of the animation/transition, and potentially
    // initial styles (like opacity: 0, transform: translateY(X)) on the elements themselves.
    if (!('IntersectionObserver' in window)) {
        console.warn("IntersectionObserver not supported, scroll animations disabled. Showing all sections.");
        // Fallback: Make all sections visible immediately
        document.querySelectorAll('main > article > section').forEach(section => section.classList.add('in-view'));
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% is visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            // Specific toggle for CTA Connect (allows animation to reverse)
            if (entry.target.classList.contains('cta-connect')) {
                entry.target.classList.toggle('in-view', entry.isIntersecting);
            }
            // General handling: Add class once and stop observing
            else {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sectionsToAnimate = document.querySelectorAll('main > article > section');

    sectionsToAnimate.forEach(section => {
        // Exclude hero from default observation if it has separate handling (e.g., via preloader)
        if (!section.classList.contains('hero')) {
            observer.observe(section);
        } else {
            // Hero visibility might be handled by preloader logic adding '.hero-visible' or similar
            // Or ensure it starts visible if no animation needed: section.classList.add('in-view');
        }
    });
};

/**
 * Updates the copyright year dynamically in the element with ID 'current-year'.
 */
const updateCopyrightYear = () => {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
};

/**
 * Initializes the project popup functionality for the carousel.
 */
const initProjectPopup = () => {
    const carousel = document.getElementById('carousel');
    const popup = document.getElementById('project-popup');
    const closeBtn = popup?.querySelector('.close-popup');
    const prevBtn = popup?.querySelector('.popup-prev-btn');
    const nextBtn = popup?.querySelector('.popup-next-btn');
    const prevName = prevBtn?.querySelector('.project-name');
    const nextName = nextBtn?.querySelector('.project-name');
    const titleElement = popup?.querySelector('.popup-title');
    const galleryElement = popup?.querySelector('.image-gallery');
    const descriptionElement = popup?.querySelector('.popup-description');
    const tagsElement = popup?.querySelector('.service-tags');
    const fullscreenOverlay = document.getElementById('fullscreen-image');
    const fullscreenImg = fullscreenOverlay?.querySelector('.fullscreen-img');
    const fullscreenClose = fullscreenOverlay?.querySelector('.fullscreen-close');
  
    if (!carousel || !popup || !closeBtn || !prevBtn || !nextBtn || !prevName || !nextName || !titleElement || !galleryElement || !descriptionElement || !tagsElement || !fullscreenOverlay || !fullscreenImg || !fullscreenClose) {
      console.warn('Project popup or fullscreen elements not found.');
      return;
    }
  
    // Prevent touch events on image gallery from bubbling to carousel
    ['touchstart', 'touchmove', 'touchend'].forEach(eventType => {
      galleryElement.addEventListener(eventType, (e) => {
        e.stopPropagation();
      });
    });
  
    // Sample project data (replace with your actual project details)
    const projects = [
      {
        title: 'Goldman Dutch',
        images: [
          './assets/images/dutchman-1.png',
          './assets/images/dutchman-2.jpg',
          './assets/images/dutchman-3.jpg',
          './assets/images/dutchman-4.jpg',
          './assets/images/dutchman-5.jpg'
        ],
        description: 'Developed a dynamic, fully responsive website for a premium coffee brand, combining seamless e-commerce functionality with secure payment integration, advanced product filtering, and user account features.',
        tags: ['Branding','Web Development', 'SEO', 'UI/UX', 'Payment Integration']
      },
      {
        title: 'Handyman',
        images: [
          './assets/images/handyman-1.png',
          './assets/images/handyman-2.png',
          './assets/images/handyman-3.png',
          './assets/images/handyman-4.png'
        ],
        description: 'Developed a clean, responsive website concept for a handyman service, designed to highlight a wide range of repair and maintenance solutions. The site features intuitive navigation, clear service categories, and easy-to-use contact forms to streamline bookings. ',
        tags: ['Concept', 'Web Development', 'UI/UX']
      },
      {
        title: 'Logofolio',
        images: [
          './assets/images/Aqua_logo.png',
          './assets/images/mm.png'
        ],
        description: 'A curated collection of logo designs showcasing versatile, impactful branding solutions across diverse industries',
        tags: ['Logo Design', 'Branding']
      },
      {
        title: 'Seatly',
        images: [
          './assets/images/seatly-1.png',
          './assets/images/seatly-2.jpg',
          './assets/images/seatly-3.jpg',
          './assets/images/seatly-4.jpg',
          './assets/images/seatly-5.jpg'

        ],
        description: 'Developed a sleek, modern website concept for, an interior design studio specialising in contemporary spaces.',
        tags: ['Concept', 'Web Development', 'UI/UX']
      },
      {
        title: 'Aqua Essence',
        images: [
          './assets/images/aqua-1.png',
          './assets/images/Aqua_logo.png'
        ],
        description:'Created a distinctive logo and developed a professional, engaging flyer to promote the launch of the swim school, highlighting its mission, inclusive activities, and registration details. ',
        tags: ['Branding', 'Logo Design', 'Marketing']
      },
      {
        title: 'Sprinkles of Essence',
        images: [
          './assets/images/sprinkles-1.png'
        ],
        description:'Successfully designed a visually appealing advertisement for a kindergarten based baking initiative. The ad emphasizes affordability, safety, and inclusivity. ',
        tags: ['Branding', 'Marketing' ]
      }
    ];
  
    let currentProjectIndex = 0; // Track the current project
  
    // Add click handlers to carousel items
    const carouselItems = carousel.querySelectorAll('.item');
    carouselItems.forEach((item, index) => {
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `View details for ${projects[index].title}`);
      item.addEventListener('click', () => openPopup(index));
      // Allow keyboard activation
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPopup(index);
        }
      });
    });
  
    // Function to update button states and text
    const updateButtonStates = () => {
      // Update disabled states
      prevBtn.disabled = currentProjectIndex === 0;
      nextBtn.disabled = currentProjectIndex === projects.length - 1;
      prevBtn.setAttribute('aria-disabled', prevBtn.disabled.toString());
      nextBtn.setAttribute('aria-disabled', nextBtn.disabled.toString());
  
      // Update button text with project names
      prevName.textContent = currentProjectIndex > 0 ? projects[currentProjectIndex - 1].title : '';
      nextName.textContent = currentProjectIndex < projects.length - 1 ? projects[currentProjectIndex + 1].title : '';
    };
  
    // Function to open full-screen image
    const openFullscreenImage = (src, alt) => {
      fullscreenImg.src = src;
      fullscreenImg.alt = alt;
      fullscreenOverlay.classList.add('active');
      fullscreenOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('fullscreen-active');
      fullscreenClose.focus(); // Focus close button
    };
  
    // Function to close full-screen image
    const closeFullscreenImage = () => {
      fullscreenOverlay.classList.remove('active');
      fullscreenOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('fullscreen-active');
      // Focus back on the gallery
      galleryElement.focus();
    };
  
    // Event listeners for full-screen image
    fullscreenClose.addEventListener('click', closeFullscreenImage);
    fullscreenOverlay.addEventListener('click', (e) => {
      if (e.target === fullscreenOverlay) closeFullscreenImage();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && fullscreenOverlay.classList.contains('active')) {
        closeFullscreenImage();
      }
    });
  
    // Function to open and populate the popup
    const openPopup = (index) => {
      const project = projects[index];
      if (!project) return;
  
      currentProjectIndex = index; // Update current index
  
      // Populate popup content
      titleElement.textContent = project.title;
      descriptionElement.textContent = project.description;
  
      // Clear and populate image gallery
      galleryElement.innerHTML = '';
      project.images.forEach((src, imgIndex) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${project.title} screenshot ${imgIndex + 1}`;
        img.className = 'popup-img';
        img.loading = 'lazy';
        img.tabIndex = 0; // Make image focusable
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `View ${img.alt} in full screen`);
        img.addEventListener('click', () => openFullscreenImage(src, img.alt));
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFullscreenImage(src, img.alt);
          }
        });
        galleryElement.appendChild(img);
      });
  
      // Clear and populate tags
      tagsElement.innerHTML = '';
      project.tags.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        tagsElement.appendChild(li);
      });
  
      // Update button states and text
      updateButtonStates();
  
      // Show popup
      popup.classList.add('active');
      popup.setAttribute('aria-hidden', 'false');
      document.body.classList.add('popup-active');
      closeBtn.focus(); // Focus close button initially
    };
  
    // Function to close the popup
    const closePopup = () => {
      popup.classList.remove('active');
      popup.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('popup-active');
      // Focus the corresponding carousel item
      const currentItem = carousel.querySelector(`.item:nth-of-type(${currentProjectIndex + 1})`);
      currentItem?.focus();
    };
  
    // Event listeners for navigation buttons
    prevBtn.addEventListener('click', () => {
      if (currentProjectIndex > 0) {
        openPopup(currentProjectIndex - 1);
        prevBtn.focus(); // Keep focus on prev button
      }
    });
  
    nextBtn.addEventListener('click', () => {
      if (currentProjectIndex < projects.length - 1) {
        openPopup(currentProjectIndex + 1);
        nextBtn.focus(); // Keep focus on next button
      }
    });
  
    // Event listeners for closing
    closeBtn.addEventListener('click', closePopup);
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closePopup(); // Close if clicking outside content
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        closePopup();
      }
    });
  };
  
  
/**
 * Main application initialization function - calls all specific init functions.
 */
const initApp = () => {
    initPreloader();
    initMobileMenu();
    initHeaderAndScrollTop();
    highlightCurrentNavLink(); // Highlight link on initial load
    // initProjectPopup(); // <-- Keep removed or commented out
    initForms();
    initVideos();
    initScrollAnimations();
    updateCopyrightYear();
    initScrollHijackCarousel(); // <-- CORRECT: Call added here at the end
    initProjectPopup(); // Add this line
    initServiceHorizontalScroll();
};
 
 // --- Initialize the App ---
 // Run initialization after the DOM is fully loaded and parsed
 if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', initApp);
 } else {
     // DOMContentLoaded has already fired
     initApp();
 }
 
 // Update navigation highlighting if the URL hash changes (e.g., clicking internal links)
 window.addEventListener('hashchange', highlightCurrentNavLink);