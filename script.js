// Landing Page JavaScript
// Handles: Meta Pixel, Google Sheets integration, Form submission, UI interactions

(function() {
  'use strict';

  // ===== Configuration =====
  const PIXEL_ID = typeof CONFIG !== 'undefined' ? CONFIG.PIXEL_ID : 'YOUR_PIXEL_ID_HERE';
  const SCRIPT_URL = typeof CONFIG !== 'undefined' ? CONFIG.SCRIPT_URL : '';

  // ===== Meta Pixel =====
  function initPixel() {
    if (PIXEL_ID && PIXEL_ID !== 'YOUR_PIXEL_ID_HERE') {
      fbq('init', PIXEL_ID);
      fbq('track', 'PageView');
    }
  }

  function trackLead() {
    if (PIXEL_ID && PIXEL_ID !== 'YOUR_PIXEL_ID_HERE') {
      fbq('track', 'Lead');
    }
  }

  // ===== Google Sheets Integration =====
  async function fetchSchedule() {
    const container = document.getElementById('schedule-container');

    // If no script URL configured, show fallback
    if (!SCRIPT_URL || SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
      renderSampleSchedule();
      return;
    }

    try {
      // Add timeout for faster fallback (5 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(SCRIPT_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch schedule');

      const data = await response.json();
      renderSchedule(data);
      populateCourseSelect(data);
      updateUrgencyNotice(data);
    } catch (error) {
      console.error('Schedule fetch error:', error);
      renderSampleSchedule();
    }
  }

  function renderSchedule(schedules) {
    const container = document.getElementById('schedule-container');

    if (!schedules || schedules.length === 0) {
      container.innerHTML = '<p class="schedule-empty">현재 예정된 강의 일정이 없습니다. 상담 신청을 통해 문의해 주세요.</p>';
      return;
    }

    const html = schedules.map(schedule => {
      const remaining = schedule.capacity - schedule.enrolled;
      const isSoldOut = remaining <= 0 || schedule.status === '마감';
      const isUrgent = remaining <= 3 && !isSoldOut;

      return `
        <div class="schedule-card ${isSoldOut ? 'sold-out' : ''}">
          <div class="schedule-header">
            <h3>${schedule.name}</h3>
          </div>
          <div class="schedule-body">
            <div class="schedule-date">
              <span>${schedule.date}</span>
              ${isUrgent ? '<span class="schedule-badge">마감 임박</span>' : ''}
              ${isSoldOut ? '<span class="schedule-badge">마감</span>' : ''}
            </div>
            <div class="schedule-time">${schedule.time}</div>
            <div class="schedule-seats">
              <span class="seats-label">잔여석</span>
              <span class="seats-count ${isUrgent ? 'urgent' : ''}">
                ${isSoldOut ? '마감' : `${remaining}석 남음`}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  function renderSampleSchedule() {
    // Fallback: show all courses closed
    const container = document.getElementById('schedule-container');
    container.innerHTML = '<div class="schedule-closed"><p>현재 모집 중인 강의가 없습니다.</p><p>상담 신청을 통해 다음 기수 일정을 문의해 주세요.</p></div>';

    // Populate course select with general inquiry only
    const select = document.getElementById('course');
    if (select) {
      select.innerHTML = '<option value="">강의를 선택해주세요</option><option value="GENERAL">다음 기수 문의</option>';
    }
  }

  function populateCourseSelect(schedules) {
    const select = document.getElementById('course');
    if (!select) return;

    // Clear existing options except the first placeholder
    select.innerHTML = '<option value="">강의를 선택해주세요</option>';

    schedules.forEach(schedule => {
      const remaining = schedule.capacity - schedule.enrolled;
      const isSoldOut = remaining <= 0 || schedule.status === '마감';

      const option = document.createElement('option');
      option.value = schedule.id;
      option.textContent = `${schedule.name} (${schedule.date})`;
      option.disabled = isSoldOut;

      if (isSoldOut) {
        option.textContent += ' - 마감';
      } else if (remaining <= 3) {
        option.textContent += ` - ${remaining}석 남음`;
      }

      select.appendChild(option);
    });

    // Add general inquiry option
    const generalOption = document.createElement('option');
    generalOption.value = 'GENERAL';
    generalOption.textContent = '일정 상관없이 상담 먼저';
    select.appendChild(generalOption);
  }

  function updateUrgencyNotice(schedules) {
    const notice = document.getElementById('urgency-notice');
    if (!notice) return;

    // Find if any course is almost full
    const urgentCourse = schedules.find(s => {
      const remaining = s.capacity - s.enrolled;
      return remaining > 0 && remaining <= 3;
    });

    if (urgentCourse) {
      const remaining = urgentCourse.capacity - urgentCourse.enrolled;
      notice.innerHTML = `⚠️ <strong>${urgentCourse.name}</strong> - 잔여석 ${remaining}석! 곧 마감됩니다.`;
      notice.style.display = 'block';
    }
  }

  // ===== Form Submission =====
  async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    submitBtn.disabled = true;

    // Collect form data
    const formData = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      company: form.company.value.trim(),
      course: form.course.value,
      message: form.message.value.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      // If script URL is configured, submit to Google Sheets
      if (SCRIPT_URL && SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
      }

      // Track Lead event
      trackLead();

      // Show success message
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';

      // Scroll to success message
      document.getElementById('form-success').scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
      console.error('Form submission error:', error);

      // Still show success (form submission via no-cors doesn't return proper response)
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
      trackLead();

    } finally {
      // Reset button state
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  // ===== Phone Number Formatting =====
  function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');

    if (value.length > 3 && value.length <= 7) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length > 7) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }

    input.value = value;
  }

  // ===== FAQ Accordion =====
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
        });

        // Toggle current item
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  }

  // ===== Modal =====
  function initModal() {
    const modalLinks = document.querySelectorAll('a[href="#privacy-policy"]');
    const modal = document.getElementById('privacy-policy');
    const closeBtn = modal.querySelector('.modal-close');

    modalLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ===== Smooth Scroll =====
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if it's a modal link
        if (href === '#privacy-policy') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ===== Floating CTA Visibility =====
  function initFloatingCTA() {
    const floatingCTA = document.querySelector('.floating-cta');
    const contactSection = document.getElementById('contact');

    if (!floatingCTA || !contactSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          floatingCTA.style.transform = 'translateY(100%)';
        } else {
          floatingCTA.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    observer.observe(contactSection);

    // Add transition
    floatingCTA.style.transition = 'transform 0.3s ease';
  }

  // ===== Initialize =====
  function init() {
    // Initialize Meta Pixel
    initPixel();

    // Fetch schedule data
    fetchSchedule();

    // Initialize FAQ accordion
    initFAQ();

    // Initialize modal
    initModal();

    // Initialize smooth scroll
    initSmoothScroll();

    // Initialize floating CTA
    initFloatingCTA();

    // Form submission handler
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', () => formatPhoneNumber(phoneInput));
    }
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
