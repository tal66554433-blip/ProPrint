/**
 * ProPrint Dynamic Google Drive Photo Gallery
 * Client-Side JavaScript for fetching and displaying public Drive folders.
 */

// --- CONFIGURATION ---
// Replace this with your restricted Google Drive API Key
const DEFAULT_API_KEY = "YOUR_GOOGLE_API_KEY_HERE";
// Default folder ID to use if not specified in the URL query string
const DEFAULT_FOLDER_ID = "1Zr475q580Wm1Y2mwzMdsGn2Ce-wR86V0";

// --- STATE MANAGEMENT ---
let allImages = [];
let currentPagedImages = [];
let currentIndex = 0;
let itemsPerPage = 24;
let currentPage = 0;
let isDemoMode = false;

// --- DOM ELEMENTS ---
const elements = {
    eventTitle: document.getElementById('event-title'),
    eventDate: document.getElementById('event-date'),
    eventBadgeText: document.getElementById('event-badge-text'),
    highlightsSection: document.getElementById('highlights-section'),
    bentoGrid: document.getElementById('bento-grid'),
    masonryGrid: document.getElementById('masonry-grid'),
    galleryLoader: document.getElementById('gallery-loader'),
    galleryError: document.getElementById('gallery-error'),
    errorMessage: document.getElementById('error-message'),
    loadMoreContainer: document.getElementById('load-more-container'),
    loadMoreBtn: document.getElementById('load-more-btn'),
    
    // Lightbox Elements
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxClose: document.getElementById('lightbox-close'),
    lightboxPrev: document.getElementById('lightbox-prev'),
    lightboxNext: document.getElementById('lightbox-next'),
    lightboxImageLoader: document.getElementById('lightbox-image-loader'),
    lightboxDownloadBtn: document.getElementById('lightbox-download-btn'),
    lightboxShareBtn: document.getElementById('lightbox-share-btn'),
    lightboxIndex: document.getElementById('lightbox-index'),
    
    // Toast
    toast: document.getElementById('toast')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    setupEventListeners();
});

function initGallery() {
    // 1. Parse URL Query Parameters
    const params = getQueryParams();
    
    // 2. Set Dynamic Headers
    const eventTitle = params.t || "הגלריה הדיגיטלית שלי";
    const eventDate = params.d || new Date().toLocaleDateString('he-IL');
    const folderId = params.f || DEFAULT_FOLDER_ID;
    const apiKey = params.key || DEFAULT_API_KEY;
    
    elements.eventTitle.textContent = eventTitle;
    elements.eventDate.innerHTML = `<i class="fa-regular fa-calendar-days"></i> ${eventDate}`;
    
    if (params.t) {
        elements.eventBadgeText.textContent = "מזכרת דיגיטלית מהאירוע";
        document.title = `הגלריה של ${eventTitle} | ProPrint`;
    }

    // 3. Load Images (API vs Demo Mode)
    if (!folderId || apiKey === "YOUR_GOOGLE_API_KEY_HERE" || apiKey === "") {
        console.warn("Folder ID or API Key is missing. Starting in Demo Mode.");
        loadDemoGallery();
    } else {
        fetchDriveGallery(folderId, apiKey);
    }
}

// --- URL PARAMETERS PARSER ---
function getQueryParams() {
    const params = {};
    const search = window.location.search.substring(1);
    if (!search) return params;
    
    const pairs = search.split('&');
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        if (pair[0]) {
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
    }
    return params;
}

// --- FETCH FROM GOOGLE DRIVE ---
async function fetchDriveGallery(folderId, apiKey) {
    showLoader(true);
    
    // Build Google Drive API v3 query URL
    // We search for files in the parent folder, filtering for images, and sorting by name/created time
    const query = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
    const fields = 'files(id,name,mimeType,thumbnailLink,webContentLink)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1000&key=${apiKey}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.files || data.files.length === 0) {
            showError("לא נמצאו תמונות בתיקייה שסופקה.", "אנא ודא שהעלית תמונות לתיקיית גוגל דרייב ושחלוקת הקישור מוגדרת כציבורית.");
            return;
        }

        // Map files to our gallery format
        allImages = data.files.map(file => {
            // Replace =s220 with =s1600 to fetch high resolution preview from Google
            const lowRes = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, '=s400') : '';
            const highRes = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, '=s1600') : '';
            const downloadUrl = file.webContentLink || `https://drive.google.com/uc?export=download&id=${file.id}`;
            
            return {
                id: file.id,
                name: file.name,
                lowRes: lowRes,
                highRes: highRes,
                downloadUrl: downloadUrl
            };
        });

        // Sort images alphabetically by name (usually aligns with sequence)
        allImages.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
        
        renderGallery();

    } catch (error) {
        console.error("Error fetching Google Drive folder:", error);
        showError("שגיאה בחיבור ל-Google Drive API", error.message || "יש לוודא שמפתח ה-API תקין ושהתיקייה מוגדרת לצפייה ציבורית.");
    }
}

// --- DEMO / FALLBACK GALLERY ---
function loadDemoGallery() {
    isDemoMode = true;
    showLoader(true);
    
    // 15 high-quality wedding and event images from Unsplash
    const demoImages = [
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225495810-7517c2965a7d?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544078751-58feb2dcbdb7?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1507504038482-7621c4b8b6e6?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1000&auto=format&fit=crop"
    ];

    allImages = demoImages.map((url, index) => ({
        id: `demo-${index}`,
        name: `תמונת דוגמה ${index + 1}`,
        lowRes: url,
        highRes: url,
        downloadUrl: url
    }));
    
    // Inject a demo warning
    elements.eventBadgeText.textContent = "מצב הדגמה - ללא חיבור לדרייב";
    
    setTimeout(() => {
        renderGallery();
    }, 800); // Simulate network latency
}

// --- RENDER GALLERY LAYOUT ---
function renderGallery() {
    showLoader(false);
    
    // 1. Render Bento Highlights (if there are at least 6 images)
    if (allImages.length >= 6) {
        elements.highlightsSection.style.display = 'block';
        renderBentoGrid(allImages.slice(0, 6));
    } else {
        elements.highlightsSection.style.display = 'none';
    }
    
    // 2. Render Masonry Grid (Paginated)
    elements.masonryGrid.innerHTML = '';
    currentPage = 0;
    currentPagedImages = [];
    
    loadNextPage();
}

function renderBentoGrid(highlights) {
    elements.bentoGrid.innerHTML = '';
    
    // Map layouts for 6 highlights
    const bentoStyles = ['large', 'tall', 'normal', 'normal', 'wide', 'normal'];
    
    highlights.forEach((img, idx) => {
        const item = document.createElement('div');
        const styleClass = bentoStyles[idx] || 'normal';
        item.className = `bento-item ${styleClass}`;
        
        // Find index of this image in allImages for Lightbox
        const absoluteIndex = allImages.findIndex(i => i.id === img.id);
        
        item.innerHTML = `
            <img src="${img.lowRes}" alt="${img.name}" loading="lazy">
            <div class="item-overlay">
                <span class="overlay-badge">נבחרת</span>
                <button class="overlay-btn"><i class="fa-solid fa-expand"></i></button>
            </div>
        `;
        
        item.addEventListener('click', () => openLightbox(absoluteIndex));
        elements.bentoGrid.appendChild(item);
    });
}

function loadNextPage() {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allImages.length);
    
    if (startIndex >= allImages.length) {
        elements.loadMoreContainer.style.display = 'none';
        return;
    }
    
    const pageSlice = allImages.slice(startIndex, endIndex);
    
    pageSlice.forEach((img) => {
        // Only render image if it exists
        const item = document.createElement('div');
        item.className = 'masonry-item';
        
        const absoluteIndex = allImages.findIndex(i => i.id === img.id);
        
        item.innerHTML = `
            <img src="${img.lowRes}" alt="${img.name}" loading="lazy">
            <div class="item-overlay">
                <button class="overlay-btn"><i class="fa-solid fa-expand"></i></button>
            </div>
        `;
        
        item.addEventListener('click', () => openLightbox(absoluteIndex));
        elements.masonryGrid.appendChild(item);
    });
    
    currentPage++;
    
    // Check if there are more images left
    if (endIndex < allImages.length) {
        elements.loadMoreContainer.style.display = 'flex';
    } else {
        elements.loadMoreContainer.style.display = 'none';
    }
}

// --- LIGHTBOX CONTROL ---
function openLightbox(index) {
    currentIndex = index;
    elements.lightbox.classList.add('active');
    elements.lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Stop body scrolling
    
    loadImageInLightbox(currentIndex);
}

function closeLightbox() {
    elements.lightbox.classList.remove('active');
    elements.lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Re-enable body scrolling
    elements.lightboxImg.src = '';
    elements.lightboxImg.classList.remove('loaded');
}

function loadImageInLightbox(index) {
    const imgData = allImages[index];
    if (!imgData) return;
    
    elements.lightboxImageLoader.style.display = 'block';
    elements.lightboxImg.classList.remove('loaded');
    
    // Preload image
    const tempImg = new Image();
    tempImg.src = imgData.highRes;
    
    tempImg.onload = () => {
        elements.lightboxImg.src = imgData.highRes;
        elements.lightboxImg.classList.add('loaded');
        elements.lightboxImageLoader.style.display = 'none';
    };
    
    // If it fails to load, fallback to lowRes
    tempImg.onerror = () => {
        elements.lightboxImg.src = imgData.lowRes;
        elements.lightboxImg.classList.add('loaded');
        elements.lightboxImageLoader.style.display = 'none';
    };
    
    // Set Footer info
    elements.lightboxIndex.textContent = `${index + 1} / ${allImages.length}`;
    
    // Set download URL
    elements.lightboxDownloadBtn.href = imgData.downloadUrl;
    
    // Prevent default actions on download btn to allow direct download in dynamic tab
    if (isDemoMode) {
        elements.lightboxDownloadBtn.setAttribute('download', imgData.name);
    } else {
        // Direct Google Drive link might need to open in a new tab for prompt download
        elements.lightboxDownloadBtn.href = imgData.downloadUrl;
    }
}

function navigateLightbox(direction) {
    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % allImages.length;
    } else {
        currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    }
    loadImageInLightbox(currentIndex);
}

// --- SHARING ---
function shareImage() {
    const imgData = allImages[currentIndex];
    if (!imgData) return;
    
    const textToShare = `צפו בתמונה הזו מהגלריה של ${elements.eventTitle.textContent}`;
    
    if (navigator.share) {
        navigator.share({
            title: elements.eventTitle.textContent,
            text: textToShare,
            url: imgData.highRes
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Copy highRes link to clipboard
        navigator.clipboard.writeText(imgData.highRes).then(() => {
            showToast("קישור לתמונה הועתק ללוח!");
        }).catch(() => {
            showToast("לא ניתן להעתיק את הקישור במכשיר זה.");
        });
    }
}

// --- EVENT LISTENERS SETUP ---
function setupEventListeners() {
    // 1. Load More Button
    elements.loadMoreBtn.addEventListener('click', loadNextPage);
    
    // 2. Infinite Scroll (Optional, but great user experience)
    window.addEventListener('scroll', () => {
        if (elements.lightbox.classList.contains('active')) return;
        
        // If scrolled to 85% of page height
        const threshold = document.documentElement.scrollHeight - window.innerHeight - 300;
        if (window.scrollY >= threshold && elements.loadMoreContainer.style.display === 'flex') {
            loadNextPage();
        }
    });

    // 3. Lightbox Controls
    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightboxPrev.addEventListener('click', () => navigateLightbox('prev'));
    elements.lightboxNext.addEventListener('click', () => navigateLightbox('next'));
    
    // Close lightbox on clicking backdrop
    elements.lightbox.addEventListener('click', (e) => {
        if (e.target === elements.lightbox || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-image-wrapper')) {
            closeLightbox();
        }
    });
    
    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (!elements.lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox('next'); // Since it is RTL, next is left
        if (e.key === 'ArrowRight') navigateLightbox('prev'); // RTL, prev is right
    });
    
    // Share Button
    elements.lightboxShareBtn.addEventListener('click', shareImage);

    // 4. Swipe Gestures for Mobile Lightbox
    let touchStartX = 0;
    let touchEndX = 0;
    
    const lightboxContent = elements.lightbox.querySelector('.lightbox-content');
    
    lightboxContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightboxContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const threshold = 50; // swipe minimum distance in pixels
        const diff = touchEndX - touchStartX;
        
        if (Math.abs(diff) < threshold) return;
        
        if (diff > 0) {
            // Swipe right -> Prev image
            navigateLightbox('prev');
        } else {
            // Swipe left -> Next image
            navigateLightbox('next');
        }
    }
}

// --- UTILITY FUNCTIONS ---
function showLoader(show) {
    elements.galleryLoader.style.display = show ? 'flex' : 'none';
}

function showError(title, message) {
    showLoader(false);
    elements.galleryError.style.display = 'block';
    elements.galleryError.querySelector('h3').textContent = title;
    elements.errorMessage.textContent = message;
    elements.masonryGrid.innerHTML = '';
    elements.loadMoreContainer.style.display = 'none';
    elements.highlightsSection.style.display = 'none';
}

function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2500);
}
