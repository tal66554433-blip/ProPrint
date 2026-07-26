// --- PROPRINT MAIN SCRIPT ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

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
    
    let isDemoScanned = false;

    if (nfcTag && nfcWaves && phoneScreenDefault && phoneScreenContent) {
        nfcTag.addEventListener('click', () => {
            if (isDemoScanned) {
                // Reset demo
                nfcTag.style.transform = 'none';
                nfcWaves.classList.remove('active');
                phoneScreenContent.classList.remove('active');
                setTimeout(() => {
                    phoneScreenContent.style.display = 'none';
                    phoneScreenDefault.style.display = 'flex';
                }, 400);
                isDemoScanned = false;
                return;
            }

            // Start animation
            // Animate tag to phone top-center NFC reader position
            nfcTag.style.transform = 'translate(200px, -350px) scale(0.8)';
            nfcWaves.classList.add('active');
            
            setTimeout(() => {
                // Move the tag back immediately after scanning so it doesn't overlap the screen
                nfcTag.style.transform = 'none';
                nfcWaves.classList.remove('active');

                // Simulate beep and load screen content
                phoneScreenDefault.style.display = 'none';
                phoneScreenContent.style.display = 'flex';
                
                // Trigger screen animation
                setTimeout(() => {
                    phoneScreenContent.classList.add('active');
                }, 50);

                // Play custom simulated vibration/beep effect using browser APIs if available
                if ('vibrate' in navigator) {
                    navigator.vibrate(200);
                }

                isDemoScanned = true;
            }, 1000);
        });
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
});
