console.log('--- game.js started ---');

const canvas = document.getElementById('gameCanvas');
console.log('Canvas element found:', canvas);

if (!canvas) {
    console.error('Canvas element not found!');
    // If canvas is not found, we cannot proceed
} else {
    const ctx = canvas.getContext('2d');
    console.log('Canvas context obtained:', ctx);

    if (!ctx) {
        console.error('Failed to get 2D context for canvas!');
        // Handle case where context is not available
    }

    const gameOverText = document.getElementById('gameOver');
    // You might not need these HTML elements if you draw everything on canvas
    const scoreValueElement = document.getElementById('scoreValue');
    const finalScoreElement = document.getElementById('finalScore');

    // Add this near the top of your file, with other global variables
    let shareButtonArea = null;
    let downloadButtonArea = null;
    let playAgainButtonArea = null;
    let score = 0;
    let gameRunning = true;
    let speedMultiplier = 1;

    // Add a flag to indicate if we are viewing a shared score
    let isViewingSharedScore = false;
    let sharedScoreData = null; // To store fetched score data

    // ตั้งค่าขนาด canvas
    function resizeCanvas() {
      // ตรวจสอบว่าเป็นมือถือหรือไม่
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // สำหรับมือถือ ใช้ขนาดเต็มหน้าจอ
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // ปรับขนาดตัวละครและสิ่งกีดขวางให้เหมาะสมกับหน้าจอ
        player.width = Math.min(60, canvas.width * 0.15);  // 15% ของความกว้างหน้าจอ แต่ไม่เกิน 60px
        player.height = player.width;
        player.speed = 5;  // ปรับความเร็วให้เหมาะสมกับมือถือ
        
        // ปรับ hitbox ของตัวละคร
        player.hitbox.width = player.width * 0.6;
        player.hitbox.height = player.hitbox.width;
      } else {
        // สำหรับเดสก์ท็อป ใช้ขนาดเดิม
        const containerWidth = Math.min(800, window.innerWidth - 40);
        const containerHeight = window.innerHeight - 150;
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // คืนค่าขนาดเดิมสำหรับเดสก์ท็อป
        player.width = 80;
        player.height = 80;
        player.speed = 6;
        player.hitbox.width = 50;
        player.hitbox.height = 50;
      }
      
      // ปรับตำแหน่งผู้เล่นเมื่อ canvas เปลี่ยนขนาด
      if (player) {
        player.x = Math.min(player.x, canvas.width - player.width);
        player.y = canvas.height - player.height - 20;
      }

      // Adjust position if game is over and viewing shared score
      if (!gameRunning && isViewingSharedScore) {
         // Redraw the game over screen on resize
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawBackground();
          const percentageToDisplay = sharedScoreData && typeof sharedScoreData.percentage === 'number' ? sharedScoreData.percentage : 0;
          drawGameOverScreen(percentageToDisplay);

          // Re-center the HTML game over element if it exists
           if (gameOverText) {
               gameOverText.style.left = '50%';
               gameOverText.style.top = '50%';
               gameOverText.style.transform = 'translate(-50%, -50%)';
           }
      } else if (gameRunning) {
          // Only adjust player position if the game is actually running
          if (player) {
            player.x = Math.min(player.x, canvas.width - player.width);
            player.y = canvas.height - player.height - 20;
          }
      }
    }

    // เรียกใช้เมื่อโหลดหน้าและเมื่อปรับขนาดหน้าจอ
    window.addEventListener('load', () => {
         // Only call resizeCanvas directly here if not viewing a shared score
        // Otherwise, resizeCanvas is called after fetching data/loading images
        if (!isViewingSharedScore && canvas) {
            resizeCanvas();
        }
    });
    window.addEventListener('resize', resizeCanvas);

    // สร้างรูปภาพ
    const playerImg = new Image();
    playerImg.onload = () => console.log('player.png loaded');
    playerImg.onerror = () => handleImageError(playerImg, 'images/player.png');
    playerImg.src = 'images/player.png';

    const playerLeftImg = new Image();
    playerLeftImg.onload = () => console.log('playerl.png loaded');
    playerLeftImg.onerror = () => handleImageError(playerLeftImg, 'images/playerl.png');
    playerLeftImg.src = 'images/playerl.png';

    const kokokImg = new Image();
    kokokImg.onload = () => console.log('kokok.png loaded');
    kokokImg.onerror = () => handleImageError(kokokImg, 'images/kokok.png');
    kokokImg.src = 'images/kokok.png';

    const obstacleImg = new Image();
    obstacleImg.onload = () => console.log('obstacle.png loaded');
    obstacleImg.onerror = () => handleImageError(obstacleImg, 'images/obstacle.png');
    obstacleImg.src = 'images/obstacle.png';

    // เพิ่มรูปพื้นหลัง
    const backgroundImg = new Image();
    backgroundImg.onload = () => console.log('wall.png loaded');
    backgroundImg.onerror = () => handleImageError(backgroundImg, 'images/wall.png');
    backgroundImg.src = 'images/wall.png';

    // เพิ่มรูปพื้นหลังสำหรับ game over
    const gameOverBackgroundImg = new Image();
    gameOverBackgroundImg.onload = () => console.log('surviveclimb.png loaded');
    gameOverBackgroundImg.onerror = () => handleImageError(gameOverBackgroundImg, 'images/surviveclimb.png');
    gameOverBackgroundImg.src = 'images/surviveclimb.png';

    // ตัวแปรเก็บรูปปัจจุบัน
    let currentPlayerImg = playerImg;

    // ตัวละคร
    let player = {
      x: 0,  // จะถูกกำหนดใน resizeCanvas
      y: 0,  // จะถูกกำหนดใน resizeCanvas
      width: 80,
      height: 80,
      speed: 6,
      hitbox: {
        width: 50,
        height: 50
      }
    };

    // สิ่งกีดขวาง
    let obstacles = [];

    // สถานะปุ่ม
    let left = false;
    let right = false;

    // ตรวจจับปุ่ม
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') left = true;
      if (e.key === 'ArrowRight') right = true;
      if (e.key === ' ' && !gameRunning) {
        // This will reset the game even when viewing a shared score
        resetGame();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') left = false;
      if (e.key === 'ArrowRight') right = false;
    });

    // เพิ่ม touch controls สำหรับมือถือ
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // ป้องกันการ scroll หน้าจอ
      const touch = e.touches[0];
      const touchX = touch.clientX - canvas.getBoundingClientRect().left;
      
      // // ถ้าเกมจบแล้ว ให้เริ่มเกมใหม่เมื่อแตะที่ไหนก็ได้
      // if (!gameRunning) {
      //   resetGame();
      //   return;
      // }
      
      // แบ่งหน้าจอเป็นซ้าย-ขวา
      if (touchX < canvas.width / 2) {
        left = true;
        right = false;
      } else {
        left = false;
        right = true;
      }
    });

    // เพิ่ม event listener สำหรับ game over screen
    gameOverText.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!gameRunning) {
        resetGame();
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      left = false;
      right = false;
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const touchX = touch.clientX - canvas.getBoundingClientRect().left;
      
      // อัพเดททิศทางตามตำแหน่งการแตะ
      if (touchX < canvas.width / 2) {
        left = true;
        right = false;
      } else {
        left = false;
        right = true;
      }
    });

    function resetGame() {
      console.log('Resetting game...');
      score = 0;
      obstacles = [];
      player.x = canvas.width / 2 - player.width / 2;
      player.y = canvas.height - player.height - 20;
      gameRunning = true;
      speedMultiplier = 1;
      // Reset button areas
      shareButtonArea = null;
      downloadButtonArea = null;
      playAgainButtonArea = null;
      isViewingSharedScore = false;
      sharedScoreData = null;

      // Ensure HTML game over text is hidden
      if (gameOverText) {
         gameOverText.style.display = 'none';
      }

      // Reset score display if using HTML element
      if (scoreValueElement) {
        scoreValueElement.textContent = '0';
      }

      // Clear canvas before starting new game
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the initial game state (background, player) before loop starts
      drawBackground(); // Draws the normal game background
      drawPlayer(); // Draws player at starting position

      // Start the animation frame loop
      draw();
    }

    // สร้างสิ่งกีดขวาง
    function createObstacle() {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const x = Math.floor(Math.random() * (canvas.width - 50));
      
      // ปรับขนาดสิ่งกีดขวางตามประเภทอุปกรณ์
      const obstacleSize = isMobile ? Math.min(90, canvas.width * 0.2) : 120; // 20% ของความกว้างหน้าจอสำหรับมือถือ แต่ไม่เกิน 90px
      
      obstacles.push({
        x,
        y: 0,
        width: obstacleSize,
        height: obstacleSize,
        speed: 3 * speedMultiplier,
        hitbox: {
          width: obstacleSize * 0.33,  // ปรับ hitbox ให้เป็น 1/3 ของขนาด
          height: obstacleSize * 0.33
        }
      });
    }

    function drawPlayer() {
      // วาดขอบสีขาว
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        player.x + player.width/2,
        player.y + player.height/2,
        player.width/2,
        0,
        Math.PI * 2
      );
    //   ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
    //   ctx.stroke();
      ctx.restore();

      // วาดรูปผู้เล่นตามทิศทางการเคลื่อนที่
      ctx.drawImage(currentPlayerImg, player.x, player.y, player.width, player.height);
    }

    function drawObstacles() {
      // วาดรูปสิ่งกีดขวาง
      obstacles.forEach(ob => {
        // วาดขอบสีขาว
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          ob.x + ob.width/2,
          ob.y + ob.height/2,
          ob.width/2,
          0,
          Math.PI * 2
        );
        // ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        // ctx.stroke();
        ctx.restore();

        // วาดรูปสิ่งกีดขวาง
        ctx.drawImage(obstacleImg, ob.x, ob.y, ob.width, ob.height);
      });
    }

    function drawScore() {
      ctx.save();
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText("Score: " + score, 20, 40);
      ctx.restore();
      // อัพเดทค่า score ใน HTML element
      // scoreValueElement.textContent = score;
    }

    function moveObstacles() {
      obstacles.forEach(ob => {
        ob.y += ob.speed;
      });

      // ลบอันที่หลุดจากจอ
      obstacles = obstacles.filter(ob => ob.y < canvas.height);
    }

    function detectCollision() {
      for (let ob of obstacles) {
        // Calculate center points of hitboxes
        const playerCenterX = player.x + player.width/2;
        const playerCenterY = player.y + player.height/2;
        const obstacleCenterX = ob.x + ob.width/2;
        const obstacleCenterY = ob.y + ob.height/2;

        // Calculate distance between centers
        const dx = playerCenterX - obstacleCenterX;
        const dy = playerCenterY - obstacleCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate minimum distance for collision
        const minDistance = (player.hitbox.width/2 + ob.hitbox.height/2);

        if (distance < minDistance) {
          gameRunning = false;
          const percentage = Math.min(Math.round((score / 1000) * 100));
          
          // Immediately save the score
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const token = localStorage.getItem('token');
          
          if (token) {
            const apiUrl = window.location.origin;
            fetch(`${apiUrl}/api/scores`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                score: score,
                percentage: percentage,
                timezone: timezone
              })
            })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to save score: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              console.log('Score saved successfully:', data);
            })
            .catch(error => {
              console.error('Error saving score:', error);
            });
          }
          
          // Clear canvas and draw game over screen
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawBackground();
          drawGameOverScreen(percentage);
          
          // Show HTML game over element
          if (gameOverText) {
            gameOverText.style.display = 'block';
            const finalScoreSpan = gameOverText.querySelector('#finalScore');
            if (finalScoreSpan) {
              finalScoreSpan.textContent = `${percentage}%`;
            }
          }
          
          return true;
        }
      }
      return false;
    }

    function updateSpeed() {
      // เพิ่มความเร็วทุก 1000 คะแนน แต่จำกัดที่ 10x
      const newMultiplier = Math.min(10, 1 + (Math.floor(score / 1000) * 0.5));
      if (newMultiplier !== speedMultiplier) {
        speedMultiplier = newMultiplier;
        // อัพเดทความเร็วของสิ่งกีดขวางที่มีอยู่
        obstacles.forEach(ob => {
          ob.speed = 3 * speedMultiplier;
        });
      }
    }

    function drawBackground() {
      // วาดพื้นหลังตามสถานะของเกม
      if (gameRunning) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
      } else {
        // วาดพื้นหลัง game over
        ctx.drawImage(gameOverBackgroundImg, 0, 0, canvas.width, canvas.height);
        
        // เพิ่ม overlay สีดำเพื่อให้ข้อความอ่านง่ายขึ้น
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    function drawGameOverScreen(percentage) {
      if (!ctx) return; // Ensure context is available

      ctx.drawImage(gameOverBackgroundImg, 0, 0, canvas.width, canvas.height);

      // --- Calculate Dynamic Modal Size and Position ---
      const modalPadding = 30; // Padding inside the modal
      const buttonHeight = 44;
      const buttonSpacing = 15;
      const buttonWidth = 180;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Determine required modal height based on content
      let requiredContentHeight = 0;

      // Calculate height based on elements present
      requiredContentHeight += 32; // Title height (approx font size)
      requiredContentHeight += buttonSpacing;
      requiredContentHeight += 48; // Score height (approx font size)
      requiredContentHeight += buttonSpacing;
      requiredContentHeight += 20; // Restart text height (approx font size)
      requiredContentHeight += buttonSpacing;
      requiredContentHeight += 100; // Rocket image height
      requiredContentHeight += buttonSpacing;
      requiredContentHeight += 32; // $KOKOK text height (approx font size)
      requiredContentHeight += buttonSpacing * 2; // Space before buttons

      // Add height for the "Play Again" button (always visible)
      requiredContentHeight += buttonHeight;

      if (!isViewingSharedScore) { // Add height for Share/Download buttons only if visible
          requiredContentHeight += buttonSpacing;
          requiredContentHeight += buttonHeight; // Share button
          requiredContentHeight += buttonSpacing;
          requiredContentHeight += buttonHeight; // Download button
      }

      const totalModalContentHeight = requiredContentHeight + modalPadding * 2; // Add top/bottom padding

      // Determine actual modal height - limit it to a percentage of canvas height
      const modalHeight = Math.min(totalModalContentHeight, canvas.height * 0.9);
      const modalWidth = Math.min(canvas.width * 0.8, 450); // Keep existing responsive width

      const modalX = (canvas.width - modalWidth) / 2;
      const modalY = (canvas.height - modalHeight) / 2;

      // Draw Modal Background
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#111";
      roundRect(ctx, modalX, modalY, modalWidth, modalHeight, 28, true, false);
      ctx.globalAlpha = 1;
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 32;
      ctx.restore();

      // --- Position Elements Vertically within the Modal ---
      let currentY = modalY + modalPadding + 10;

      // Title
      ctx.save();
      ctx.font = "bold 24px Arial"; // Keep slightly smaller font for title
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("KOKOK TO THE MOON!", canvas.width / 2, currentY);
      currentY += 28 + buttonSpacing; // Move Y down by title height + spacing

      // Score Percentage
      ctx.font = "bold 44px Arial";
      ctx.fillStyle = "#6ccb4f";
       if (isViewingSharedScore && sharedScoreData && sharedScoreData.error) {
           ctx.font = "bold 24px Arial";
           ctx.fillStyle = "red";
           ctx.fillText(`Error: ${sharedScoreData.error}`, canvas.width / 2, currentY);
           currentY += 24 + buttonSpacing; // Move Y down by error height + spacing
      } else {
           ctx.fillText(`Up to ${percentage}%`, canvas.width / 2, currentY);
           currentY += 48 + buttonSpacing; // Move Y down by score height + spacing
      }

      // Restart Text (Now optional or can be removed/changed if Play Again button is primary)
      // Keep it for visual consistency, but its action is tied to button/tap
      ctx.font = "20px Arial";
      ctx.fillStyle = "#fff";
      const restartTextContent = isMobile ? "Tap outside modal to play" : "Press Space or click Play Again"; // Update text
      ctx.fillText(restartTextContent, canvas.width / 2, currentY);
      currentY += 20 + buttonSpacing; // Move Y down by text height + spacing


      // Rocket Image & $KOKOK Text
      // Only draw image if not in an error state when viewing shared score
       if (!isViewingSharedScore || (sharedScoreData && !sharedScoreData.error)) {
          const imageWidth = 140; // Image size from previous code
          const imageHeight = 100;
          ctx.drawImage(kokokImg, canvas.width / 2 - imageWidth / 2, currentY, imageWidth, imageHeight);
          currentY += imageHeight + buttonSpacing; // Move Y down by image height + spacing

           // $KOKOK text
          ctx.font = "bold 32px Arial";
          ctx.fillStyle = "#ffd700";
          ctx.fillText("$KOKOK", canvas.width / 2, currentY);
          currentY += 32 + buttonSpacing * 2; // Move Y down by text height + more spacing before buttons
      }


      // --- Draw Buttons ---

      // Always draw the "Play Again" button
      const playAgainBtnY = currentY; // Position Play Again button
       playAgainButtonArea = {
           x: canvas.width / 2 - buttonWidth / 2,
           y: playAgainBtnY,
           width: buttonWidth,
           height: buttonHeight
       };

       ctx.save();
       ctx.fillStyle = "#4CAF50"; // Green color for Play Again
       ctx.strokeStyle = "#fff";
       ctx.lineWidth = 2;
       ctx.shadowColor = "#222";
       ctx.shadowBlur = 8;
       roundRect(ctx, playAgainButtonArea.x, playAgainButtonArea.y, buttonWidth, buttonHeight, 12, true, true);
       ctx.font = "bold 22px Arial";
       ctx.fillStyle = "#fff";
       ctx.textAlign = "center";
       ctx.textBaseline = "middle";
       ctx.fillText("Play Again", canvas.width / 2, playAgainBtnY + buttonHeight / 2);
       ctx.restore();

       currentY += buttonHeight + buttonSpacing; // Move Y down by button height + spacing


       if (!isViewingSharedScore) {
           // Draw Share button (Only in active game over)
           const shareBtnY = currentY; // Position Share button below Play Again
           shareButtonArea = {
             x: canvas.width / 2 - buttonWidth / 2, // Center horizontally
             y: shareBtnY,
             width: buttonWidth,
             height: buttonHeight,
             percentage: percentage // Store percentage for sharing
           };

           ctx.save();
           ctx.fillStyle = "#4caf50"; // Green Share button
           ctx.strokeStyle = "#fff";
           ctx.lineWidth = 2;
           ctx.shadowColor = "#222";
           ctx.shadowBlur = 8;
           roundRect(ctx, shareButtonArea.x, shareButtonArea.y, buttonWidth, buttonHeight, 12, true, true);
           ctx.font = "bold 22px Arial";
           ctx.fillStyle = "#fff";
           ctx.textAlign = "center";
           ctx.textBaseline = "middle";
           ctx.fillText("Share Score", canvas.width / 2, shareBtnY + buttonHeight / 2);
           ctx.restore();

           currentY += buttonHeight + buttonSpacing; // Move Y down by button height + spacing


           // Draw Download button (Only in active game over)
           const downloadBtnY = currentY; // Position Download button below Share
           downloadButtonArea = {
               x: canvas.width / 2 - buttonWidth / 2, // Center horizontally
               y: downloadBtnY,
               width: buttonWidth,
               height: buttonHeight
           };

           ctx.save();
           ctx.fillStyle = "#007bff"; // Use blue for Download
           ctx.strokeStyle = "#fff";
           ctx.lineWidth = 2;
           ctx.shadowColor = "#222";
           ctx.shadowBlur = 8;
           roundRect(ctx, downloadButtonArea.x, downloadButtonArea.y, buttonWidth, buttonHeight, 12, true, true);
           ctx.font = "bold 22px Arial";
           ctx.fillStyle = "#fff";
           ctx.textAlign = "center";
           ctx.textBaseline = "middle";
           ctx.fillText("Download Image", canvas.width / 2, downloadBtnY + buttonHeight / 2);
           ctx.restore();

       } else {
           // If viewing shared score but there was an error, ensure Share/Download/Upload button areas are null
           shareButtonArea = null;
           downloadButtonArea = null;
           uploadScoreButtonArea = null;
       }

      ctx.restore(); // Restore context after drawing modal
    }

    // Helper function for rounded rectangles
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
      if (typeof stroke === 'undefined') {
        stroke = true;
      }
      if (typeof radius === 'undefined') {
        radius = 5;
      }
      if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
      } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
          radius[side] = radius[side] || defaultRadius[side];
        }
      }
      ctx.beginPath();
      ctx.moveTo(x + radius.tl, y);
      ctx.lineTo(x + width - radius.tr, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
      ctx.lineTo(x + width, y + height - radius.br);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
      ctx.lineTo(x + radius.bl, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
      ctx.lineTo(x, y + radius.tl);
      ctx.quadraticCurveTo(x, y, x + radius.tl, y);
      ctx.closePath();
      if (fill) {
        ctx.fill();
      }
      if (stroke) {
        ctx.stroke();
      }
    }

    function draw() {
      // Check if we are viewing a shared score - if so, draw loop shouldn't run
      if (isViewingSharedScore) {
          // The game over screen is drawn once in loadAndDisplaySharedScore
          // We only need to redraw it here if the canvas was resized
          // The resizeCanvas function handles redrawing the game over screen
          return;
      }

      // Only continue the game loop if game is running
      if (!gameRunning) {
        // Game is over - ensure game over screen is visible
        if (gameOverText) {
          gameOverText.style.display = 'block';
        }
        return;
      }

      // Clear canvas only when game is running and rendering normally
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw game background
      drawBackground();

      // Increase score
      score++;

      // Update speed
      updateSpeed();

      // Move player and change image based on direction
      if (left && player.x > 0) {
        player.x -= player.speed;
        currentPlayerImg = playerLeftImg;
      }
      if (right && player.x < canvas.width - player.width) {
        player.x += player.speed;
        currentPlayerImg = playerImg;
      }

      drawPlayer();
      drawObstacles();
      drawScore();
      moveObstacles();

      // Check for collision
      if (detectCollision()) {
        // The game over screen is drawn directly from detectCollision
        return;
      }

      // Request next frame only if game is still running
      requestAnimationFrame(draw);
    }

    // Check if click/tap is inside a given button area
    function isClickInsideButton(clickX, clickY, buttonArea) {
        if (!buttonArea) return false;
        
        // Add a larger touch target area for mobile
        const touchPadding = 25; // Increased padding for better touch targets
        
        // Create a larger hit area for the button
        return clickX >= (buttonArea.x - touchPadding) &&
               clickX <= (buttonArea.x + buttonArea.width + touchPadding) &&
               clickY >= (buttonArea.y - touchPadding) &&
               clickY <= (buttonArea.y + buttonArea.height + touchPadding);
    }

    canvas.addEventListener('click', function(e) {
      // Only process clicks if game is over
      if (!gameRunning) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Check Play Again button first (always visible when !gameRunning)
          if (isClickInsideButton(x, y, playAgainButtonArea)) {
              resetGame();
              return; // Stop processing
          }

          // Check Share button area (always visible when !gameRunning)
          if (isClickInsideButton(x, y, shareButtonArea)) {
            // Use the percentage stored in the shareButtonArea
            shareScore(shareButtonArea.percentage);
            return; // Stop checking other buttons
          }

          // Check Download button area (always visible when !gameRunning)
          if (isClickInsideButton(x, y, downloadButtonArea)) {
            navigateToScorePageForDownload();
            return; // Stop checking other buttons
          }

          // Optional: Handle tap outside modal/buttons to reset game
          // If you want tapping *anywhere* outside the modal to reset, add logic here
          // For now, tapping outside might not do anything unless covered by another listener.
      }
    });

    canvas.addEventListener('touchstart', function(e) {
       e.preventDefault(); // Prevent scrolling and default touch actions

       const touch = e.touches[0];
       const rect = canvas.getBoundingClientRect();
       const x = touch.clientX - rect.left;
       const y = touch.clientY - rect.top;

       // Only process touches if game is over
        if (!gameRunning) {
           // First check if any button is pressed, regardless of position
           if (isClickInsideButton(x, y, playAgainButtonArea)) {
               resetGame();
               return; // Stop processing
           }

           if (isClickInsideButton(x, y, shareButtonArea)) {
             shareScore(shareButtonArea.percentage);
             return; // Stop checking other buttons
           }

           if (isClickInsideButton(x, y, downloadButtonArea)) {
             navigateToScorePageForDownload();
             return; // Stop processing other buttons
           }

           // Only check top 50% for non-button touches
           if (y > canvas.height / 2) {
               return; // Ignore non-button touches in bottom half
           }

           // Only allow tapping anywhere to restart if not clicking a button
           const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
           if (isMobile && !isClickInsideButton(x, y, playAgainButtonArea) && 
               !isClickInsideButton(x, y, shareButtonArea) && 
               !isClickInsideButton(x, y, downloadButtonArea)) {
               resetGame();
               return;
           }
        }

       // Handle player movement touch logic only if game is running
        if (gameRunning) {
             const touchX = touch.clientX - canvas.getBoundingClientRect().left;
             // Divide screen into left/right for movement
              if (touchX < canvas.width / 2) {
                left = true;
                right = false;
              } else {
                left = false;
                right = true;
              }
         }
    });

    // Update touchmove to also respect the top 50% rule when game is over
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (!gameRunning) {
            // Check if touch is on any button first
            if (isClickInsideButton(x, y, playAgainButtonArea) ||
                isClickInsideButton(x, y, shareButtonArea) ||
                isClickInsideButton(x, y, downloadButtonArea)) {
                return; // Allow touch movement on buttons
            }

            // Only process non-button touches in top 50%
            if (y > canvas.height / 2) {
                return; // Ignore non-button touches in bottom half
            }
            e.preventDefault(); // Prevent scrolling when game is over
        } else {
            const touchX = touch.clientX - canvas.getBoundingClientRect().left;
            // Divide screen into left/right for movement
            if (touchX < canvas.width / 2) {
                left = true;
                right = false;
            } else {
                left = false;
                right = true;
            }
        }
    }, { passive: false });

    // Update touchend to reset controls
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (gameRunning) {
            left = false;
            right = false;
        }
    });

    // Add a helper function to calculate the required modal height (used in touchstart check)
    function getCalculatedModalHeight() {
       const modalPadding = 30;
       const buttonHeight = 44;
       const buttonSpacing = 15;

       let requiredContentHeight = 0;
       requiredContentHeight += 32; // Title height (approx)
       requiredContentHeight += buttonSpacing;
       requiredContentHeight += 48; // Score height (approx)
       requiredContentHeight += buttonSpacing;
       requiredContentHeight += 20; // Restart text height (approx)
       requiredContentHeight += buttonSpacing;
       requiredContentHeight += 100; // Rocket image height
       requiredContentHeight += buttonSpacing;
       requiredContentHeight += 32; // $KOKOK text height (approx)
       requiredContentHeight += buttonSpacing * 2; // Space before buttons

       requiredContentHeight += buttonHeight; // Play Again button height

       if (!isViewingSharedScore) { // Add height for Share/Download buttons only if visible
           requiredContentHeight += buttonSpacing;
           requiredContentHeight += buttonHeight; // Share button
           requiredContentHeight += buttonSpacing;
           requiredContentHeight += buttonHeight; // Download button
       }

       return requiredContentHeight + modalPadding * 2;
    }

    // Move the shareScore function inside the main game scope
    async function shareScore(percentage) {
      try {
        const apiUrl = window.location.origin;
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('You must be logged in to share your score');
        }

        // Get timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // First, save the score to the database and get the score ID
        const response = await fetch(`${apiUrl}/api/scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            score: score,
            percentage: percentage,
            timezone: timezone
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save score: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const scoreId = data._id; // Changed from data.id to data._id to match MongoDB's ID field
        const scoreUrl = `${apiUrl}/score/${scoreId}`;
        const shareText = `I survived up to ${percentage}% in KOKOK Game! Check out my score: ${scoreUrl}`;

        // Check if we're in a secure context and if Web Share API is available
        if (window.isSecureContext && navigator.share) {
          try {
            await navigator.share({
              title: 'KOKOK Game Score',
              text: shareText,
              url: scoreUrl
            });
            return; // Exit if share was successful
          } catch (shareError) {
            // Only log if it's not a user cancellation
            if (shareError.name !== 'AbortError') {
              console.log('Web Share API failed:', shareError);
            }
            // Continue to clipboard fallback
          }
        }
        
        // Fallback to clipboard copy
        try {
          await navigator.clipboard.writeText(shareText);
          alert('Score URL copied to clipboard!');
        } catch (clipboardError) {
          console.error('Clipboard copy failed:', clipboardError);
          // Last resort fallback - show the URL
          alert(`Share this URL: ${scoreUrl}`);
        }
        
      } catch (error) {
        console.error('Failed to share score:', error);
        alert('Failed to share score. Please try again.');
      }
    }

    // Update the copyTextToClipboard function
    async function copyTextToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (err) {
          console.error('Clipboard API failed:', err);
          throw err;
        }
      } else {
        // Fallback for older browsers
        return new Promise((resolve, reject) => {
          try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            resolve(true);
          } catch (err) {
            reject(err);
          }
        });
      }
    }

    // Add this function to download the currently displayed canvas as an image
    function downloadSharedScoreImage() {
        console.log('Attempting to download score image...');

        try {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                console.error('Canvas element not found for download.');
                alert('Could not capture screen for download.');
                return;
            }

            // Get canvas data as PNG with high quality
            const dataURL = canvas.toDataURL('image/png', 1.0);

            // Create a temporary anchor element
            const link = document.createElement('a');
            link.href = dataURL;
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `kokok_score_${timestamp}.png`;
            link.download = filename;

            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('Score image download triggered:', filename);

            // Show success message
            alert('Score image downloaded successfully!');

        } catch (error) {
            console.error('Failed to capture canvas for download:', error);
            alert('Could not download image. Please try again.');
        }
    }

    // Add this function to navigate to the score page for download
    async function navigateToScorePageForDownload() {
        console.log('Attempting to navigate to score page for download...');
    
        try {
            // Get timezone
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('You must be logged in to save your score');
            }

            // Save the score to get an ID
            const apiUrl = window.location.origin;
            const response = await fetch(`${apiUrl}/api/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    score: score,
                    percentage: Math.min(Math.round((score / 1000) * 100)),
                    timezone: timezone
                })
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save score before navigating: ${response.status} ${response.statusText} - ${errorText}`);
            }
    
            const data = await response.json();
            const scoreId = data._id;
            const scoreUrl = `${apiUrl}/score/${scoreId}`;
    
            // Navigate the user to the score page
            window.location.href = scoreUrl;
    
        } catch (error) {
            console.error('Failed to navigate to score page for download:', error);
            alert('Could not prepare score for download. Please try again.');
        }
    }

    // --- Add this function to load and display a specific score ---
    async function loadAndDisplaySharedScore(scoreId) {
        isViewingSharedScore = true;

        try {
            const apiUrl = window.location.origin;
            console.log(`Fetching score from: ${apiUrl}/api/scores/${scoreId}`);
            
            const response = await fetch(`${apiUrl}/api/scores/${scoreId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch shared score ${scoreId}: ${response.status} ${response.statusText} - ${errorText}`);
                sharedScoreData = { score: 0, percentage: 0, error: `Failed to load score: ${response.statusText}` };
            } else {
                sharedScoreData = await response.json();
                console.log('Fetched shared score data:', sharedScoreData);
                
                // Validate the score data
                if (!sharedScoreData || typeof sharedScoreData.score !== 'number' || typeof sharedScoreData.percentage !== 'number') {
                    console.error('Invalid data format for shared score:', sharedScoreData);
                    sharedScoreData = { score: 0, percentage: 0, error: 'Invalid score data' };
                }
            }

        } catch (error) {
            console.error(`Error during fetch for score ${scoreId}:`, error);
            sharedScoreData = { score: 0, percentage: 0, error: 'Network Error' };
        }

        // Ensure images are loaded before drawing the final screen
        Promise.all([
            new Promise(resolve => { if (playerImg.complete) resolve(); else playerImg.onload = resolve; }),
            new Promise(resolve => { if (playerLeftImg.complete) resolve(); else playerLeftImg.onload = resolve; }),
            new Promise(resolve => { if (kokokImg.complete) resolve(); else kokokImg.onload = resolve; }),
            new Promise(resolve => { if (obstacleImg.complete) resolve(); else obstacleImg.onload = resolve; }),
            new Promise(resolve => { if (backgroundImg.complete) resolve(); else backgroundImg.onload = resolve; }),
            new Promise(resolve => { if (gameOverBackgroundImg.complete) resolve(); else gameOverBackgroundImg.onload = resolve; })
        ]).then(() => {
            // Now draw the game over screen using the fetched data
            console.log('Images loaded for shared score display. Drawing game over screen.');
            // Clear the canvas first
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBackground(); // Draw game over background
            // Use fetched percentage, default to 0 if fetch failed or data invalid
            const percentageToDisplay = sharedScoreData && typeof sharedScoreData.percentage === 'number' ? sharedScoreData.percentage : 0;
            drawGameOverScreen(percentageToDisplay);

            // --- Automatically trigger upload after displaying the shared score screen ---
            if (sharedScoreData && sharedScoreData._id) { // Changed from id to _id to match MongoDB
                console.log(`Automatically uploading image for shared score ID: ${sharedScoreData._id}`);
                // Use a small delay to ensure rendering is complete
                setTimeout(() => {
                    uploadScoreImage(sharedScoreData._id);
                }, 100);
            }

            // Update the HTML game over element if it exists
            if (gameOverText) {
                if (sharedScoreData && sharedScoreData.error) {
                    gameOverText.innerHTML = `<h2>Error</h2><p>${sharedScoreData.error}</p><p class="restart-text">Tap or Press Space to play</p>`;
                } else if (sharedScoreData) {
                    // Find the element that displays the percentage in the HTML game over div
                    const finalScoreSpan = gameOverText.querySelector('#finalScore');
                    if (finalScoreSpan) {
                        finalScoreSpan.textContent = `${percentageToDisplay}%`;
                    }

                    // Add player info if available
                    if (sharedScoreData.playerData) {
                        const playerInfoDiv = gameOverText.querySelector('.player-info') || document.createElement('div');
                        playerInfoDiv.className = 'player-info';
                        playerInfoDiv.innerHTML = `
                            <p class="player-name">${sharedScoreData.playerData.name || 'Anonymous'}</p>
                            <p class="player-country">${sharedScoreData.playerData.country || 'Unknown Country'}</p>
                        `;
                        if (!gameOverText.querySelector('.player-info')) {
                            gameOverText.insertBefore(playerInfoDiv, gameOverText.querySelector('.restart-text'));
                        }
                    }

                    // Ensure the restart text is correct
                    const restartTextElement = gameOverText.querySelector('.restart-text');
                    if (restartTextElement) {
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        restartTextElement.textContent = isMobile ? "Tap anywhere to play again" : "Press Space to play again";
                    }
                } else {
                    gameOverText.innerHTML = `<h2>Loading Error</h2><p>Could not display score</p><p class="restart-text">Tap or Press Space to play</p>`;
                }
                gameOverText.style.display = 'block'; // Make HTML overlay visible
            }
        }).catch(imgError => {
            console.error('Error loading images for shared score display:', imgError);
            // Display an error on canvas if images fail
            if (ctx) {
                ctx.font = "20px Arial";
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.fillText("Error loading assets!", canvas.width / 2, canvas.height / 2);
            }
        });

        // Prevent the game loop from starting automatically
        // The loop will only start if the user clicks "Play Again" or presses Space
    }

    // Check the URL on page load
    const pathSegments = window.location.pathname.split('/');
    if (pathSegments.length === 3 && pathSegments[1] === 'score') {
        const scoreId = pathSegments[2];
        console.log(`Detected shared score URL with ID: ${scoreId}. Loading score...`);
        gameRunning = false; // Ensure game doesn't start normally
        loadAndDisplaySharedScore(scoreId); // Fixed: Changed from loadAndDisplayScore to loadAndDisplaySharedScore
    } else {
        // Normal game start logic, now encapsulated in startGame function
        console.log('Not a shared score URL. Waiting for user to start game.');
        // The startGame function will be called by the Play Game button
        // startGame(); // Removed automatic call
    }

    // --- New function to start the game ---
    function startGame() {
        console.log('Starting game...');
        resetGame(); // Reset game state
        resizeCanvas(); // Initial canvas size set
        Promise.all([
          new Promise(resolve => { if (playerImg.complete) resolve(); else playerImg.onload = resolve; }),
          new Promise(resolve => { if (playerLeftImg.complete) resolve(); else playerLeftImg.onload = resolve; }),
          new Promise(resolve => { if (kokokImg.complete) resolve(); else kokokImg.onload = resolve; }),
          new Promise(resolve => { if (obstacleImg.complete) resolve(); else obstacleImg.onload = resolve; }),
          new Promise(resolve => { if (backgroundImg.complete) resolve(); else backgroundImg.onload = resolve; }),
          new Promise(resolve => { if (gameOverBackgroundImg.complete) resolve(); else gameOverBackgroundImg.onload = resolve; })
        ]).then(() => {
          console.log('All images loaded for normal game. Starting game loop...');
          // Start game logic after resize and image loading
          setInterval(createObstacle, 1000);
          draw(); // Call draw to start the rendering loop
        }).catch(error => {
            console.error('Error loading one or more images for normal game:', error);
            if (ctx) {
                ctx.font = "20px Arial";
                ctx.fillStyle = "red";
                ctx.textAlign = "center";
                ctx.fillText("Error loading game assets!", canvas.width / 2, canvas.height / 2);
            }
        });

        // Hide the login container and show the game container
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
    }
}

function handleImageError(img, src) {
  console.error(`Failed to load image: ${src}`);
  // Depending on your game logic, you might stop the game or use a placeholder image
  // Set a flag if image loading is critical before starting the game
}
