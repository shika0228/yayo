/* ---------- 主视觉动画（淡出时并行启动） ---------- */
function playMainVisual() {
  if (!(window.gsap)) return;

  gsap.set("#main-visual-wrap-1", { x: "-100vw", opacity: 0 });
  gsap.set("#main-visual-wrap-2", { x: "100vw", opacity: 0 });

  const tl = gsap.timeline({ delay: 0.2 });
  tl.to("#main-visual-wrap-1", {
    x: 0, opacity: 1, duration: 1.3, ease: "elastic.out(0.7, 0.5)"
  });
  tl.to("#main-visual-wrap-2", {
    x: 0, opacity: 1, duration: 1.3, ease: "elastic.out(0.7, 0.5)"
  }, "<0.2");
}

/* ---------- 注册 ScrollTrigger ---------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ---------- ABOUT：弹性进场 ---------- */
function initAboutEnter() {
  if (!(window.gsap && window.ScrollTrigger)) return;
  gsap.set(".about-box", { x: 120, opacity: 0 });
  gsap.timeline({
    scrollTrigger: { trigger: ".about-wrap-2", start: "top 75%", once: true }
  }).to(".about-box", {
    x: 0, opacity: 1, ease: "elastic.out(0.8, 0.5)", duration: 1.1,
    stagger: { each: 0.18, from: "start" }
  });
}

/* ---------- Carousel：中心放大 + 自动轮播 + 按钮 + 拖拽 ---------- */
function initCostumeCarousel() {
  const root = document.getElementById('costume-carousel');
  if (!root) return;

  const items = Array.from(root.querySelectorAll('.carousel-wrap'));
  if (!items.length) return;

  items.forEach(el => el.querySelector('img')?.setAttribute('draggable', 'false'));
  root.style.touchAction = 'pan-y';
  root.style.userSelect = 'none';
  root.style.webkitUserSelect = 'none';
  root.style.position = root.style.position || 'relative';
  root.style.zIndex = root.style.zIndex || '10';

  const prevBtn = root.querySelector('.carousel-btn.prev');
  const nextBtn = root.querySelector('.carousel-btn.next');
  [prevBtn, nextBtn].forEach(btn => {
    if (btn) { btn.style.zIndex = '9999'; btn.style.pointerEvents = 'auto'; }
  });


  const N = items.length;
  let index = 0;
  let dragX = 0;
  let isDown = false, startX = 0, lastX = 0, lastT = 0, velocity = 0, movedPx = 0;


  const getStepX = () => Math.min(420, Math.max(180, root.clientWidth * 0.22));
  const maxShow = 4;
  const blurUnit = 0.4;
  const rotUnit = -2.5;
  const scaleLevels = { 0: 1.3, 1: 0.9, 2: 0.8, 3: 0.7, 4: 0.7 };
  const opacityLevels = { 0: 1.0, 1: 0.30, 2: 0.15, 3: 0.05, 4: 0.00 };

  const rel = (i, cur) => {
    let d = i - cur;
    if (d > N / 2) d -= N;
    if (d <= -N / 2) d += N;
    return d;
  };

  function layout(cur, animate = true) {
    const stepX = getStepX();
    items.forEach((el, i) => {
      const r = rel(i, cur);
      const ar = Math.abs(r);

      if (ar > maxShow) {
        el.style.opacity = '0';
        el.style.transform = `translate(-50%, -50%) translateX(${r * stepX}px) scale(${scaleLevels[4]})`;
        el.style.filter = `blur(${(maxShow + 1) * blurUnit}px)`;
        el.style.zIndex = `${50 - ar}`;
        el.style.transition = 'none';
        return;
      }

      const x = r * stepX + dragX;
      const sc = scaleLevels[ar];
      const op = opacityLevels[ar];
      const blur = ar * blurUnit;
      const z = 100 - ar;
      const rotY = r * rotUnit;

      el.style.zIndex = `${z}`;
      el.style.opacity = `${op}`;
      el.style.filter = `blur(${blur}px)`;
      el.style.transition = animate ? 'transform .6s ease, opacity .6s ease, filter .6s ease' : 'none';
      el.style.transform = `translate(-50%, -50%) translateX(${x}px) rotateY(${rotY}deg) scale(${sc})`;
      el.style.pointerEvents = ar === 0 ? 'auto' : 'none';
    });
  }

  function go(delta = 1) {
    index = (index + delta + N) % N;
    layout(index, true);
  }


  const AUTOPLAY_MS = 2300;
  let timer = null;
  function start() { if (!timer) timer = setInterval(() => go(+1), AUTOPLAY_MS); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  // 按钮
  if (prevBtn) prevBtn.addEventListener('click', (e) => {
    e.stopPropagation(); stop(); go(-1); start();
    if (window.gsap) gsap.fromTo(prevBtn, { scale: 1 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
  });
  if (nextBtn) nextBtn.addEventListener('click', (e) => {
    e.stopPropagation(); stop(); go(+1); start();
    if (window.gsap) gsap.fromTo(nextBtn, { scale: 1 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
  });

  function onPointerDown(e) {
    if (e.target.closest('.carousel-btn')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    isDown = true; root.setPointerCapture?.(e.pointerId);
    stop();
    startX = e.clientX; lastX = startX; lastT = performance.now();
    velocity = 0; movedPx = 0; dragX = 0;
    layout(index, false);
    root.style.cursor = 'grabbing';
  }
  function onPointerMove(e) {
    if (!isDown) return;
    const x = e.clientX, now = performance.now();
    const dx = x - startX;


    const instV = (x - lastX) / Math.max(1, (now - lastT));
    velocity = 0.8 * velocity + 0.2 * instV;


    const stepX = getStepX();
    const soft = Math.abs(dx) > stepX * 1.2
      ? (stepX * 1.2 * Math.sign(dx) + (dx - stepX * 1.2) * 0.4)
      : dx;

    dragX = soft;
    movedPx += Math.abs(x - lastX);
    lastX = x; lastT = now;
    layout(index, false);
    e.preventDefault();
  }
  function onPointerUp(e) {
    if (!isDown) return;
    isDown = false; root.releasePointerCapture?.(e.pointerId);
    root.style.cursor = '';

    const stepX = getStepX();
    const delta = dragX / stepX;
    let flickSteps = velocity * 150 / stepX;
    let advance = Math.round(delta + flickSteps);
    advance = Math.max(-2, Math.min(2, advance));

    if (Math.abs(advance) >= 1) index = (index - advance + N) % N;

    dragX = 0; layout(index, true);

    if (movedPx > 5) {
      const swallowOnce = (ev) => {
        if (ev.target.closest('.carousel-btn')) return;
        ev.stopPropagation(); ev.preventDefault();
      };
      root.addEventListener('click', swallowOnce, true);
      setTimeout(() => root.removeEventListener('click', swallowOnce, true), 0);
    }
    start();
  }

  root.addEventListener('pointerdown', onPointerDown, { passive: true });
  root.addEventListener('pointermove', onPointerMove, { passive: false });
  root.addEventListener('pointerup', onPointerUp, { passive: true });
  root.addEventListener('pointercancel', onPointerUp, { passive: true });
  root.addEventListener('pointerleave', onPointerUp, { passive: true });

  layout(index, false);
  start();
  window.addEventListener('resize', () => layout(index, false));

  root._carouselAPI = { go, stop, start, getIndex: () => index };
}

/* ---------- Loading：淡出与主视觉并行，去卡顿 ---------- */
function initLoading() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  const fill = screen.querySelector('.progress-fill');
  const text = screen.querySelector('.progress-text');

  let progress = 0;

  const timer = setInterval(() => {
    progress += Math.random() * 20;
    if (progress > 100) progress = 100;
    if (fill) fill.style.width = progress + "%";
    if (text) text.textContent = Math.floor(progress) + "%";

    if (progress >= 100) {
      clearInterval(timer);

      setTimeout(() => {
        screen.classList.add("loaded");

        setTimeout(() => {
          screen.classList.add("fade-out");

          setTimeout(() => { playMainVisual(); }, 100);

          setTimeout(() => { screen.remove(); }, 700);

        }, 1100);
      }, 250);
    }
  }, 120);
}

/* ---------- 返回顶部按钮（到 illust 中才出现） ---------- */
function initTopBtn() {
  if (!(window.gsap && window.ScrollTrigger)) return;
  const topBtn = document.querySelector('.top-btn');
  if (!topBtn) return;

  gsap.set(topBtn, { bottom: 0, autoAlpha: 0 });


  ScrollTrigger.create({
    trigger: '#illust',
    start: 'center center',
    onEnter: () => {
      topBtn.classList.add('active');
      gsap.set(topBtn, { bottom: 0, autoAlpha: 1 });
      updateTopBtn();
    },
    onLeaveBack: () => {
      topBtn.classList.remove('active');
      gsap.set(topBtn, { autoAlpha: 0 });
    }
  });

  function updateTopBtn() {
    if (!topBtn.classList.contains('active')) return;

    const doc = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    const viewportH = window.innerHeight;
    const docH = Math.max(doc.scrollHeight, body.scrollHeight);
    const distanceFromBottom = Math.max(0, docH - viewportH - scrollY);

    let bottomPx = 0;
    if (distanceFromBottom <= 400) {
      bottomPx = 400 - distanceFromBottom;
    } else {
      bottomPx = 0;
    }
    bottomPx = Math.min(400, Math.max(0, bottomPx));

    gsap.to(topBtn, { duration: 0.15, bottom: bottomPx, overwrite: true });
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => { updateTopBtn(); ticking = false; });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  updateTopBtn();
}

/* ---------- Illust：水汽感淡入（blur→清晰 + 轻柔上浮） ---------- */
function initIllustVaporEnter() {
  if (!(window.gsap && window.ScrollTrigger)) return;

  gsap.fromTo(".illust-title",
    { y: 30, opacity: 0, filter: "blur(6px)" },
    {
      y: 0, opacity: 1, filter: "blur(0px)",
      duration: 0.9, ease: "power2.out",
      scrollTrigger: {
        trigger: ".illust",
        start: "top 80%",
        once: true
      }
    }
  );

  gsap.fromTo(".gallery li",
    { y: 28, opacity: 0, filter: "blur(10px)" },
    {
      y: 0, opacity: 1, filter: "blur(0px)",
      duration: 1.2, ease: "power3.out",
      stagger: { each: 0.06, from: "random" },
      scrollTrigger: {
        trigger: ".illust",
        start: "top 78%",
        once: true
      },
      onComplete: () => {
        gsap.utils.toArray(".gallery li").forEach((li, i) => {
          gsap.to(li, {
            y: "+=4",
            duration: 3.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: (i % 7) * 0.15,
          });
        });
      }
    }
  );
}

/* ---------- DOM Ready：初始化一切 ---------- */
document.addEventListener("DOMContentLoaded", () => {

  initCostumeCarousel();


  initLoading();

  initAboutEnter();
  initTopBtn();
  initIllustVaporEnter();
});
