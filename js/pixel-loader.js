const PixelLoader = (() => {
  let canvas, ctx;
  let animId = null;
  let isShattering = false;
  let isSpinning = false;
  
  // Animation state
  let angle = 0;
  let lastTime = 0;
  let particles = [];
  
  // Floppy disk / Card design
  const cardData = [
    "011111111111110",
    "122222211222221",
    "122222211222221",
    "122222211222221",
    "122222211222221",
    "122222222222221",
    "122222222222221",
    "122111111111221",
    "122133333331221",
    "122133333331221",
    "122133333331221",
    "122133333331221",
    "122133333331221",
    "122111111111221",
    "122222222222221",
    "011111111111110"
  ];
  
  const colorMap = {
    '1': '#666666', // Border
    '2': '#333333', // Body
    '3': '#cccccc'  // Label
  };
  
  const pixelSize = 8;
  const cardWidth = cardData[0].length * pixelSize;
  const cardHeight = cardData.length * pixelSize;

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: true });
    window.addEventListener('resize', resize);
    resize();
  }

  function resize() {
    if (!canvas) return;
    // Adjust size slightly smaller than viewport to ensure it fits mobile
    canvas.width = window.innerWidth;
    // We want the loader to be mostly in the upper half to leave room for the ASCII text
    canvas.height = window.innerHeight * 0.6; 
  }

  function start() {
    if (!canvas) return;
    isShattering = false;
    isSpinning = true;
    particles = [];
    angle = 0;
    lastTime = performance.now();
    cancelAnimationFrame(animId);
    loop();
  }

  function shatter(callback) {
    if (!canvas || !isSpinning) {
      if (callback) callback();
      return;
    }
    isSpinning = false;
    isShattering = true;
    
    // Generate particles
    particles = [];
    const scaleX = Math.cos(angle);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Starting offset for drawing card centered
    const startX = cx - (cardWidth * scaleX) / 2;
    const startY = cy - cardHeight / 2;
    
    for (let r = 0; r < cardData.length; r++) {
      for (let c = 0; c < cardData[r].length; c++) {
        const char = cardData[r][c];
        if (char !== '0') {
          // Pixel's position on screen before shatter
          const px = startX + c * pixelSize * scaleX;
          const py = startY + r * pixelSize;
          
          // Random velocity radiating outward, somewhat chaotic
          const vx = (Math.random() - 0.5) * 15;
          const vy = (Math.random() - 1.0) * 15;
          
          particles.push({
            x: px,
            y: py,
            vx: vx,
            vy: vy,
            color: colorMap[char],
            alpha: 1,
            size: pixelSize * (0.8 + Math.random() * 0.4) // slightly randomize piece sizes
          });
        }
      }
    }
    
    // Continue loop until shattered
    let shatterTime = performance.now();
    
    function shatterLoop(time) {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let allFaded = true;
      for (let p of particles) {
        if (p.alpha > 0) {
          allFaded = false;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.5; // gravity
          p.vx *= 0.95; // friction
          p.alpha -= 0.02; // fade out
          
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;
      
      if (!allFaded && (time - shatterTime < 2000)) {
        animId = requestAnimationFrame(shatterLoop);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (callback) callback();
      }
    }
    
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(shatterLoop);
  }

  function loop(time = performance.now()) {
    if (!isSpinning) return;
    
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    angle += dt * 3; // spin speed
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scaleX = Math.cos(angle);
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, 1);
    
    // Draw centered card
    const startX = -cardWidth / 2;
    const startY = -cardHeight / 2;
    
    for (let r = 0; r < cardData.length; r++) {
      for (let c = 0; c < cardData[r].length; c++) {
        const char = cardData[r][c];
        if (char !== '0') {
          ctx.fillStyle = colorMap[char];
          ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    
    ctx.restore();
    animId = requestAnimationFrame(loop);
  }

  return { init, start, shatter };
})();
