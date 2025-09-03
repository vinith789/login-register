function toggleMenu() {
    const navLinks = document.getElementById("navLinks");
    const hamburger = document.getElementById("hamburger").querySelector("i");

    navLinks.classList.toggle("show");

    if (navLinks.classList.contains("show")) {
      hamburger.classList.remove("fa-bars");
      hamburger.classList.add("fa-times"); // Close icon
    } else {
      hamburger.classList.remove("fa-times");
      hamburger.classList.add("fa-bars"); // Hamburger icon
    }
  }

// JavaScript for the image slider
  const slidesContainer = document.querySelector('.slides');
  let slides = document.querySelectorAll('.slide');
  const prevBtn = document.querySelector('.prev');
  const nextBtn = document.querySelector('.next');
  const dotsContainer = document.querySelector('.dots');
  let currentIndex = 1;
  let autoSlide;
  const slideInterval = 3000;

  // Clone first and last slides
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);
  firstClone.id = 'first-clone';
  lastClone.id = 'last-clone';

  slidesContainer.appendChild(firstClone);
  slidesContainer.insertBefore(lastClone, slidesContainer.firstChild);

  slides = document.querySelectorAll('.slide');
  const size = slides[0].clientWidth;
  slidesContainer.style.transform = `translateX(-${size * currentIndex}px)`;

  // Create dots
  for (let i = 0; i < slides.length - 2; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      currentIndex = i + 1;
      updateSlide();
      resetAutoSlide();
    });
    dotsContainer.appendChild(dot);
  }
  const dots = document.querySelectorAll('.dot');

  function updateSlide() {
    slidesContainer.style.transition = 'transform 1s ease-in-out';
    slidesContainer.style.transform = `translateX(-${size * currentIndex}px)`;
    dots.forEach(dot => dot.classList.remove('active'));
    dots[(currentIndex - 1 + dots.length) % dots.length].classList.add('active');
  }

  function nextSlide() {
    if (currentIndex >= slides.length - 1) return;
    currentIndex++;
    updateSlide();
  }

  function prevSlideFunc() {
    if (currentIndex <= 0) return;
    currentIndex--;
    updateSlide();
  }

  slidesContainer.addEventListener('transitionend', () => {
    if (slides[currentIndex].id === firstClone.id) {
      slidesContainer.style.transition = 'none';
      currentIndex = 1;
      slidesContainer.style.transform = `translateX(-${size * currentIndex}px)`;
    }
    if (slides[currentIndex].id === lastClone.id) {
      slidesContainer.style.transition = 'none';
      currentIndex = slides.length - 2;
      slidesContainer.style.transform = `translateX(-${size * currentIndex}px)`;
    }
  });

  function startAutoSlide() {
    autoSlide = setInterval(() => {
      if (currentIndex >= slides.length - 1) return;
      currentIndex++;
      updateSlide();
    }, slideInterval);
  }

  function resetAutoSlide() {
    clearInterval(autoSlide);
    startAutoSlide();
  }

  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoSlide();
  });

  prevBtn.addEventListener('click', () => {
    prevSlideFunc();
    resetAutoSlide();
  });

  startAutoSlide();