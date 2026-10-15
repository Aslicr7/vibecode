const cards = document.querySelectorAll('.card');
const titleDisplay = document.getElementById('titleDisplay');
const bgGlow = document.getElementById('bgGlow');
const carousel = document.getElementById('carousel');
const gamepadBadge = document.getElementById('gamepadBadge');
let currentIndex = 0;
let isInteracting = false;
let scrollTimeout = null;

// Cập nhật đồng hồ đỉnh đầu
function updateClock() {
  const now = new Date();
  document.getElementById('clock').innerText = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Đổi trạng thái thẻ active
function updateActiveCard(index) {
  if (index < 0) index = 0;
  if (index >= cards.length) index = cards.length - 1;
  currentIndex = index;

  cards.forEach((card, i) => {
    if (i === currentIndex) {
      card.classList.add('active');
      titleDisplay.innerText = card.dataset.title;
      bgGlow.style.background = `radial-gradient(circle at 50% 30%, ${card.dataset.color}, transparent 70%)`;
    } else {
      card.classList.remove('active');
    }
  });
}

// Chọn thẻ chủ động (Chuột, Phím mũi tên, Gamepad)
function selectCard(index) {
  if (index < 0) index = 0;
  if (index >= cards.length) index = cards.length - 1;
  
  isInteracting = true;
  updateActiveCard(index);

  // Chỉ cuộn nếu màn hình nhỏ / mobile có thanh cuộn tràn
  if (carousel.scrollWidth > carousel.clientWidth) {
    cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // Khóa nhận diện cuộn tự động trong lúc animation đang chạy để tránh nhảy loạn
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isInteracting = false;
  }, 450);
}

// Chỉ tính tâm tự động khi người dùng VUỐT TAY trên màn hình cảm ứng điện thoại
function detectCenterCard() {
  if (isInteracting || carousel.scrollWidth <= carousel.clientWidth) return;

  const containerRect = carousel.getBoundingClientRect();
  const containerCenter = containerRect.left + containerRect.width / 2;

  let closestIndex = currentIndex;
  let minDistance = Infinity;

  cards.forEach((card, index) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const distance = Math.abs(containerCenter - cardCenter);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  if (closestIndex !== currentIndex) {
    updateActiveCard(closestIndex);
  }
}

// Bắt sự kiện cuộn khi vuốt tay
carousel.addEventListener('scroll', () => {
  if (!isInteracting) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(detectCenterCard, 50);
  }
}, { passive: true });

function openSelected() {
  const targetUrl = cards[currentIndex].dataset.url;
  // Nếu có link thì mở trang, nếu link rỗng (dự án chưa ra mắt) thì bỏ qua
  if (targetUrl && targetUrl.trim() !== '') {
    window.location.href = targetUrl;
  } else {
    // Hiệu ứng rung nhẹ báo hiệu chưa mở được
    cards[currentIndex].animate([
      { transform: 'scale(1.05) translateX(-5px)' },
      { transform: 'scale(1.05) translateX(5px)' },
      { transform: 'scale(1.05) translateX(0)' }
    ], { duration: 150 });
  }
}

// 1. Chuột máy tính (Click để chọn hoặc mở, rê chuột êm ái không giật)
cards.forEach((card, index) => {
  card.addEventListener('mouseenter', () => {
    isInteracting = true;
    updateActiveCard(index);
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => { isInteracting = false; }, 200);
  });

  card.addEventListener('click', () => {
    if (currentIndex === index) {
      openSelected();
    } else {
      selectCard(index);
    }
  });
});

// 2. Bàn phím máy tính & Remote TV
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'Right') {
    selectCard(currentIndex + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
    selectCard(currentIndex - 1);
  } else if (e.key === 'Enter') {
    openSelected();
  } else if (e.key === 'Escape' || e.key === 'Backspace') {
    window.history.back();
  }
});
// 3. Tay cầm Gamepad (PlayStation / Xbox)
let lastPadTime = 0;
window.addEventListener('gamepadconnected', () => {
  gamepadBadge.style.display = 'flex';
});
window.addEventListener('gamepaddisconnected', () => {
  gamepadBadge.style.display = 'none';
});

function pollGamepad() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = gamepads[0];
  if (gp) {
    gamepadBadge.style.display = 'flex';
    const now = Date.now();
    if (now - lastPadTime > 200) {
      const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
      const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;
      const stickLeft = gp.axes[0] < -0.5;
      const stickRight = gp.axes[0] > 0.5;
      const btnCross = gp.buttons[0] && gp.buttons[0].pressed;   // Nút X (PS) hoặc A (Xbox) -> Chọn
      const btnCircle = gp.buttons[1] && gp.buttons[1].pressed;  // Nút O (PS) hoặc B (Xbox) -> Back

      if (dpadRight || stickRight) {
        selectCard(currentIndex + 1);
        lastPadTime = now;
      } else if (dpadLeft || stickLeft) {
        selectCard(currentIndex - 1);
        lastPadTime = now;
      } else if (btnCross) {
        openSelected();
        lastPadTime = now;
      } else if (btnCircle) {
        // Hành động quay lại lịch sử trình duyệt
        window.history.back();
        lastPadTime = now;
      }
    }
  }
  requestAnimationFrame(pollGamepad);
}
requestAnimationFrame(pollGamepad);