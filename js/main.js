// --- PROPRINT MAIN SCRIPT ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll Effect
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link, .nav-cta');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Toggle hamburger animation
            const spans = menuToggle.querySelectorAll('span');
            spans[0].style.transform = navMenu.classList.contains('active') ? 'rotate(45deg) translate(6px, 6px)' : 'none';
            spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
            spans[2].style.transform = navMenu.classList.contains('active') ? 'rotate(-45deg) translate(6px, -6px)' : 'none';
        });

        // Close menu when link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    // 3. Scroll Animations (Intersection Observer)
    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => fadeObserver.observe(el));

    // 4. Interactive NFC Demo
    const nfcTag = document.getElementById('nfc-tag-demo');
    const nfcWaves = document.getElementById('nfc-waves');
    const phoneScreenDefault = document.getElementById('phone-screen-default');
    const phoneScreenContent = document.getElementById('phone-screen-content');
    const resetScanBtn = document.getElementById('reset-scan-btn');
    
    let isDemoScanned = false;

    function resetNfcDemo() {
        if (phoneScreenContent) phoneScreenContent.style.display = 'none';
        if (phoneScreenDefault) phoneScreenDefault.style.display = 'flex';
        if (nfcTag) nfcTag.style.transform = 'none';
        if (nfcWaves) nfcWaves.classList.remove('active');
        isDemoScanned = false;
    }

    if (nfcTag && nfcWaves && phoneScreenDefault && phoneScreenContent) {
        nfcTag.addEventListener('click', () => {
            if (isDemoScanned) {
                resetNfcDemo();
                return;
            }

            // Start scan animation
            nfcTag.style.transform = 'translate(200px, -350px) scale(0.8)';
            nfcWaves.classList.add('active');
            
            setTimeout(() => {
                // Return tag to resting spot
                nfcTag.style.transform = 'none';
                nfcWaves.classList.remove('active');

                // Vibrate if mobile browser supports it
                if ('vibrate' in navigator) {
                    navigator.vibrate(200);
                }

                // Transition: Hide Default, Show Content
                phoneScreenDefault.style.display = 'none';
                phoneScreenContent.style.display = 'flex';
                isDemoScanned = true;

            }, 1000);
        });

        // Reset scanning link listener
        if (resetScanBtn) {
            resetScanBtn.addEventListener('click', (e) => {
                e.preventDefault();
                resetNfcDemo();
            });
        }

        const appBackBtnMock = document.getElementById('app-back-btn-mock');
        if (appBackBtnMock) {
            appBackBtnMock.addEventListener('click', (e) => {
                e.preventDefault();
                resetNfcDemo();
            });
        }
    }

    // 5. Toggle Other input in Contact Form
    const eventTypeSelect = document.getElementById('contact-event-type');
    const otherWrapper = document.getElementById('contact-event-type-other-wrapper');
    const otherInput = document.getElementById('contact-event-type-other');
    
    if (eventTypeSelect && otherWrapper) {
        eventTypeSelect.addEventListener('change', () => {
            if (eventTypeSelect.value === 'other') {
                otherWrapper.style.display = 'flex';
                if (otherInput) otherInput.required = true;
            } else {
                otherWrapper.style.display = 'none';
                if (otherInput) {
                    otherInput.required = false;
                    otherInput.value = '';
                }
            }
        });
    }

    // 6. Contact Form Submission via WhatsApp
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('contact-name').value;
            const phone = document.getElementById('contact-phone').value;
            const email = document.getElementById('contact-email').value;
            const eventType = document.getElementById('contact-event-type').value;
            const details = document.getElementById('contact-details').value;

            // Translate event type
            let eventLabel = 'אחר / הדפסה אישית';
            if (eventType === 'wedding') eventLabel = 'מזכרות ועיצוב לחתונה (B2C)';
            if (eventType === 'corporate') eventLabel = 'מיתוג עסקי ומוצרי קד"מ (B2B)';
            if (eventType === 'keychains') eventLabel = 'מחזיקי מפתחות NFC בעיצוב אישי';
            if (eventType === 'stands') eventLabel = 'מעמדי שולחן יוקרתיים בעיצוב אישי';
            if (eventType === 'other' && otherInput) {
                eventLabel = `אחר: ${otherInput.value}`;
            }

            const message = `שלום ProPrint!
השארתי פרטים באתר לגבי התעניינות בפתרונות מעוצבים.
להלן הפרטים שלי:
שם: ${name}
טלפון: ${phone}
אימייל: ${email}
סוג השירות: ${eventLabel}
פרטים נוספים: ${details}

אשמח שתחזרו אליי עם הצעת מחיר.`;

            const encodedMsg = encodeURIComponent(message);
            const whatsappUrl = `https://api.whatsapp.com/send?phone=972532708553&text=${encodedMsg}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }

    // 6. Interactive Smooth Scrolling for CTA buttons
    const scrollButtons = document.querySelectorAll('[data-scroll-to]');
    scrollButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-scroll-to');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const headerOffset = 80;
                const elementPosition = targetEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 7. Dynamic Accessibility Widget
    function initAccessibility() {
        // Create widget container
        const widget = document.createElement('div');
        widget.className = 'accessibility-widget';
        widget.id = 'accessibility-widget';
        
        // Accessibility widget HTML template
        widget.innerHTML = `
            <button class="acc-floating-btn" id="acc-floating-btn" aria-label="תפריט נגישות" title="תפריט נגישות">
                <i class="fa-solid fa-universal-access"></i>
            </button>
            <div class="acc-panel" id="acc-panel" aria-modal="true" role="dialog" aria-label="תפריט נגישות">
                <div class="acc-header">
                    <h3>תפריט נגישות</h3>
                    <button class="acc-close-btn" id="acc-close-btn" aria-label="סגור תפריט נגישות"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="acc-body-panel">
                    <button class="acc-option-btn" id="btn-acc-font-plus"><i class="fa-solid fa-magnifying-glass-plus"></i> הגדל טקסט</button>
                    <button class="acc-option-btn" id="btn-acc-font-minus"><i class="fa-solid fa-magnifying-glass-minus"></i> הקטן טקסט</button>
                    <button class="acc-option-btn" id="btn-acc-contrast-dark"><i class="fa-solid fa-circle-half-stroke"></i> ניגודיות כהה</button>
                    <button class="acc-option-btn" id="btn-acc-contrast-light"><i class="fa-solid fa-sun"></i> ניגודיות בהירה</button>
                    <button class="acc-option-btn" id="btn-acc-grayscale"><i class="fa-solid fa-droplet-slash"></i> מונוכרום</button>
                    <button class="acc-option-btn" id="btn-acc-links"><i class="fa-solid fa-link"></i> הדגש קישורים</button>
                    <button class="acc-option-btn" id="btn-acc-font"><i class="fa-solid fa-font"></i> גופן קריא</button>
                    <button class="acc-option-btn" id="btn-acc-animations"><i class="fa-solid fa-circle-pause"></i> עצור אנימציות</button>
                    <a href="accessibility.html" class="acc-declaration-link"><i class="fa-solid fa-file-signature"></i> הצהרת נגישות</a>
                    <button class="acc-reset-btn" id="btn-acc-reset"><i class="fa-solid fa-rotate-left"></i> איפוס הגדרות</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        
        // Element references
        const floatBtn = document.getElementById('acc-floating-btn');
        const panel = document.getElementById('acc-panel');
        const closeBtn = document.getElementById('acc-close-btn');
        
        // Toggle panel
        if (floatBtn && panel) {
            floatBtn.addEventListener('click', () => {
                panel.classList.toggle('active');
            });
        }
        
        if (closeBtn && panel) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('active');
            });
        }
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (panel && panel.classList.contains('active') && !widget.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
        
        // Accessibility Options Logic
        const body = document.body;
        const html = document.documentElement;
        
        // Option State variables
        let fontSizeLevel = parseInt(localStorage.getItem('acc-font-size') || '0'); // -1, 0, 1, 2
        let contrastMode = localStorage.getItem('acc-contrast') || 'none'; // 'none', 'dark', 'light'
        let grayscaleActive = localStorage.getItem('acc-grayscale') === 'true';
        let linksActive = localStorage.getItem('acc-links') === 'true';
        let readableFontActive = localStorage.getItem('acc-readable-font') === 'true';
        let stopAnimationsActive = localStorage.getItem('acc-animations') === 'true';
        
        // Apply saved states on load
        applySavedAccessibility();
        
        function applySavedAccessibility() {
            const wrapper = document.getElementById('page-wrapper') || body;
            
            // Font size
            html.classList.remove('acc-font-lg', 'acc-font-xl');
            if (fontSizeLevel === 1) html.classList.add('acc-font-lg');
            if (fontSizeLevel === 2) html.classList.add('acc-font-xl');
            updateBtnState('btn-acc-font-plus', fontSizeLevel > 0);
            updateBtnState('btn-acc-font-minus', fontSizeLevel < 0);
            
            // Contrast
            wrapper.classList.remove('acc-contrast-dark', 'acc-contrast-light');
            if (contrastMode === 'dark') {
                wrapper.classList.add('acc-contrast-dark');
            }
            if (contrastMode === 'light') {
                wrapper.classList.add('acc-contrast-light');
            }
            updateBtnState('btn-acc-contrast-dark', contrastMode === 'dark');
            updateBtnState('btn-acc-contrast-light', contrastMode === 'light');
            
            // Grayscale
            wrapper.classList.toggle('acc-grayscale', grayscaleActive);
            updateBtnState('btn-acc-grayscale', grayscaleActive);
            
            // Links
            wrapper.classList.toggle('acc-underline-links', linksActive);
            updateBtnState('btn-acc-links', linksActive);
            
            // Font
            wrapper.classList.toggle('acc-readable-font', readableFontActive);
            updateBtnState('btn-acc-font', readableFontActive);
            
            // Animations
            wrapper.classList.toggle('acc-stop-animations', stopAnimationsActive);
            updateBtnState('btn-acc-animations', stopAnimationsActive);
        }
        
        function updateBtnState(id, active) {
            const btn = document.getElementById(id);
            if (btn) {
                if (active) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        }
        
        // Event Listeners for options
        document.getElementById('btn-acc-font-plus').addEventListener('click', () => {
            if (fontSizeLevel < 2) {
                fontSizeLevel++;
                localStorage.setItem('acc-font-size', fontSizeLevel);
                applySavedAccessibility();
            }
        });
        
        document.getElementById('btn-acc-font-minus').addEventListener('click', () => {
            if (fontSizeLevel > -1) {
                fontSizeLevel--;
                localStorage.setItem('acc-font-size', fontSizeLevel);
                applySavedAccessibility();
            }
        });
        
        document.getElementById('btn-acc-contrast-dark').addEventListener('click', () => {
            contrastMode = contrastMode === 'dark' ? 'none' : 'dark';
            localStorage.setItem('acc-contrast', contrastMode);
            applySavedAccessibility();
        });
        
        document.getElementById('btn-acc-contrast-light').addEventListener('click', () => {
            contrastMode = contrastMode === 'light' ? 'none' : 'light';
            localStorage.setItem('acc-contrast', contrastMode);
            applySavedAccessibility();
        });
        
        document.getElementById('btn-acc-grayscale').addEventListener('click', () => {
            grayscaleActive = !grayscaleActive;
            localStorage.setItem('acc-grayscale', grayscaleActive);
            applySavedAccessibility();
        });
        
        document.getElementById('btn-acc-links').addEventListener('click', () => {
            linksActive = !linksActive;
            localStorage.setItem('acc-links', linksActive);
            applySavedAccessibility();
        });
        
        document.getElementById('btn-acc-font').addEventListener('click', () => {
            readableFontActive = !readableFontActive;
            localStorage.setItem('acc-readable-font', readableFontActive);
            applySavedAccessibility();
        });
        
        document.getElementById('btn-acc-animations').addEventListener('click', () => {
            stopAnimationsActive = !stopAnimationsActive;
            localStorage.setItem('acc-animations', stopAnimationsActive);
            applySavedAccessibility();
        });
        
        document.getElementById('btn-acc-reset').addEventListener('click', () => {
            fontSizeLevel = 0;
            contrastMode = 'none';
            grayscaleActive = false;
            linksActive = false;
            readableFontActive = false;
            stopAnimationsActive = false;
            
            localStorage.removeItem('acc-font-size');
            localStorage.removeItem('acc-contrast');
            localStorage.removeItem('acc-grayscale');
            localStorage.removeItem('acc-links');
            localStorage.removeItem('acc-readable-font');
            localStorage.removeItem('acc-animations');
            
            applySavedAccessibility();
        });
    }

    initAccessibility();

    // 8. Global FAQ Accordion Logic
    const faqButtons = document.querySelectorAll('.faq-question-btn');
    faqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.parentElement;
            const panel = btn.nextElementSibling;
            const isActive = card.classList.contains('active');
            
            // Close all other panels in the same parent element
            const group = card.parentElement;
            if (group) {
                group.querySelectorAll('.faq-item-card').forEach(c => {
                    c.classList.remove('active');
                    const p = c.querySelector('.faq-answer-panel');
                    if (p) p.style.maxHeight = null;
                });
            }
            
            if (!isActive) {
                card.classList.add('active');
                if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });
});
