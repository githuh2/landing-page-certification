// V4: Image-based Detail Page Script

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Meta Pixel
  initPixel();

  // Form handling
  initForm();

  // Modal handling
  initModal();

  // Smooth scroll for anchor links
  initSmoothScroll();
});

// Meta Pixel
function initPixel() {
  if (typeof fbq === 'function' && CONFIG.PIXEL_ID && CONFIG.PIXEL_ID !== 'YOUR_PIXEL_ID_HERE') {
    fbq('init', CONFIG.PIXEL_ID);
    fbq('track', 'PageView');
  }
}

// Form Submission
function initForm() {
  const form = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    submitBtn.disabled = true;

    const formData = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      company: form.company.value.trim() || '-',
      course: form.course.value,
      message: form.message.value.trim() || '-',
      timestamp: new Date().toISOString(),
      source: 'v4-image-page'
    };

    try {
      // Send to Google Sheets
      if (CONFIG.SCRIPT_URL) {
        await fetch(CONFIG.SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      // Track Lead event
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', {
          content_name: formData.course,
          content_category: 'Course Inquiry'
        });
      }

      // Show success
      form.style.display = 'none';
      formSuccess.style.display = 'block';

      // Scroll to success message
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
      console.error('Form submission error:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
}

// Modal
function initModal() {
  const modal = document.getElementById('privacy-policy');
  if (!modal) return;

  // Open modal
  document.querySelectorAll('a[href="#privacy-policy"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Close modal
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Smooth Scroll
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#privacy-policy') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const headerHeight = 56;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });
}
