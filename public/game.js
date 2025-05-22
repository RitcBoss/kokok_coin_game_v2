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
    let health = 3; // Maximum health
    let maxHealth = 3; // Store max health for reference
    let heartSize = 35; // Size of each heart
    let heartSpacing = 10; // Space between hearts
    let isInvincible = false; // Track invincibility state
    let invincibilityTime = 1000; // 1 second of invincibility
    let lastDamageTime = 0; // Track when last damage was taken
    let invincibilityTimer = null; // Store the timer reference
    let isFacingLeft = false; // Initialize player facing direction

    // Add a flag to indicate if we are viewing a shared score
    let isViewingSharedScore = false;
    let sharedScoreData = null; // To store fetched score data

    // Add variables for death animation
    let isDying = false;
    let deathAnimationStartTime = 0;
    const deathAnimationDuration = 500; // 2 seconds in milliseconds

    // Add background music
    const backgroundMusic = new Audio('music.mp3');
    const startMusic = new Audio('music_start.mp3');
    const oofMusic = new Audio('music_oof.mp3');
    backgroundMusic.loop = true; // Make the music loop
    let isMusicPlaying = false;
    let musicInitialized = false;

    // Add error handling for audio loading
    backgroundMusic.addEventListener('error', (e) => {
        console.warn('Background music could not be loaded:', e);
        isMusicPlaying = false;
    });

    startMusic.addEventListener('error', (e) => {
        console.warn('Start music could not be loaded:', e);
    });

    oofMusic.addEventListener('error', (e) => {
        console.warn('Oof music could not be loaded:', e);
    });

    // Set volume for oof sound
    oofMusic.volume = 0.3; // 10% volume

    // Function to handle music
    function toggleMusic() {
        if (!musicInitialized) {
            musicInitialized = true;
            backgroundMusic.volume = 0.5;
        }
        
        if (isMusicPlaying) {
            backgroundMusic.pause();
            isMusicPlaying = false;
        } else {
            playMusic();
        }
    }

    // Function to play music with retry
    function playMusic() {
        if (!backgroundMusic.src) {
            console.warn('No music source available');
            return;
        }
        
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isMusicPlaying = true;
                console.log('Music started successfully');
            }).catch(error => {
                console.error('Error playing music:', error);
                isMusicPlaying = false;
                // Only retry if the error is not related to user interaction
                if (error.name !== 'NotAllowedError') {
                    setTimeout(() => {
                        playMusic();
                    }, 1000);
                }
            });
        }
    }

    // Initialize music when the page loads
    window.addEventListener('load', () => {
        // Set volume to 50%
        backgroundMusic.volume = 0.3;
        // Don't try to play music automatically
    });

    // Add event listener for user interaction to start music
    document.addEventListener('click', () => {
        if (!musicInitialized) {
            musicInitialized = true;
            playMusic();
        }
    }, { once: true });

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause music when page is hidden
            backgroundMusic.pause();
        } else if (isMusicPlaying) {
            // Resume music when page becomes visible again
            playMusic();
        }
    });

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
    const playerDieImg = new Image();
    const kokokImg = new Image();
    const kokokcoinImg = new Image();
    const coinpowerImg = new Image();
    const obstacleImg = new Image();
    const mePaImg = new Image();
    const meElonImg = new Image();
    const meJeromeImg = new Image();
    const meThrumImg = new Image();
    const mePuImg = new Image();
    const backgroundImg = new Image();
    const gameOverBackgroundImg = new Image();

    // Add image loading tracking
    let imagesLoaded = {
        player: false,
        playerDie: false,
        kokok: false,
        kokokcoin: false,
        coinpower: false,
        obstacle: false,
        mePa: false,
        meElon: false,
        meJerome: false,
        meThrum: false,
        mePu: false,
        background: false,
        gameOverBackground: false
    };

    // Update image loading handlers and set sources
    playerImg.onload = () => {
        console.log('player.png loaded');
        imagesLoaded.player = true;
    };
    playerImg.onerror = () => {
        console.error('Failed to load player.png');
        handleImageError(playerImg, 'images/player.png');
    };
    playerImg.src = 'images/player.png';

    playerDieImg.onload = () => {
        console.log('player_die.png loaded');
        imagesLoaded.playerDie = true;
    };
    playerDieImg.onerror = () => {
        console.error('Failed to load player_die.png');
        handleImageError(playerDieImg, 'images/player_die.png');
    };
    playerDieImg.src = 'images/player_die.png';

    kokokImg.onload = () => {
        console.log('kokok.png loaded');
        imagesLoaded.kokok = true;
    };
    kokokImg.onerror = () => {
        console.error('Failed to load kokok.png');
        handleImageError(kokokImg, 'images/kokok.png');
    };
    kokokImg.src = 'images/kokok.png';

    kokokcoinImg.onload = () => {
        console.log('kokokcoin.png loaded');
        imagesLoaded.kokokcoin = true;
    };
    kokokcoinImg.onerror = () => {
        console.error('Failed to load kokokcoin.png');
        handleImageError(kokokcoinImg, 'images/kokokcoin.png');
    };
    kokokcoinImg.src = 'images/kokokcoin.png';

    obstacleImg.onload = () => {
        console.log('obstacle.png loaded');
        imagesLoaded.obstacle = true;
    };
    obstacleImg.onerror = () => {
        console.error('Failed to load obstacle.png');
        handleImageError(obstacleImg, 'images/obstacle.png');
    };
    obstacleImg.src = 'images/obstacle.png';

    mePaImg.onload = () => {
        console.log('me_pa.png loaded');
        imagesLoaded.mePa = true;
    };
    mePaImg.onerror = () => {
        console.error('Failed to load me_pa.png');
        handleImageError(mePaImg, 'images/me_pa.png');
    };
    mePaImg.src = 'images/me_pa.png';

    meElonImg.onload = () => {
        console.log('me_elon.png loaded');
        imagesLoaded.meElon = true;
    };
    meElonImg.onerror = () => {
        console.error('Failed to load me_elon.png');
        handleImageError(meElonImg, 'images/me_elon.png');
    };
    meElonImg.src = 'images/me_elon.png';

    meJeromeImg.onload = () => {
        console.log('me_jerome.png loaded');
        imagesLoaded.meJerome = true;
    };
    meJeromeImg.onerror = () => {
        console.error('Failed to load me_jerome.png');
        handleImageError(meJeromeImg, 'images/me_jerome.png');
    };
    meJeromeImg.src = 'images/me_jerome.png';

    meThrumImg.onload = () => {
        console.log('me_thrum.png loaded');
        imagesLoaded.meThrum = true;
    };
    meThrumImg.onerror = () => {
        console.error('Failed to load me_thrum.png');
        handleImageError(meThrumImg, 'images/me_thrum.png');
    };
    meThrumImg.src = 'images/me_thrum.png';

    mePuImg.onload = () => {
        console.log('me_pu.png loaded');
        imagesLoaded.mePu = true;
    };
    mePuImg.onerror = () => {
        console.error('Failed to load me_pu.png');
        handleImageError(mePuImg, 'images/me_pu.png');
    };
    mePuImg.src = 'images/me_pu.png';

    backgroundImg.onload = () => {
        console.log('wall.png loaded');
        imagesLoaded.background = true;
    };
    backgroundImg.onerror = () => {
        console.error('Failed to load wall.png');
        handleImageError(backgroundImg, 'images/wall.png');
    };
    backgroundImg.src = 'images/wall.png';

    gameOverBackgroundImg.onload = () => {
        console.log('surviveclimb.png loaded');
        imagesLoaded.gameOverBackground = true;
    };
    gameOverBackgroundImg.onerror = () => {
        console.error('Failed to load surviveclimb.png');
        handleImageError(gameOverBackgroundImg, 'images/surviveclimb.png');
    };
    gameOverBackgroundImg.src = 'images/surviveclimb.png';

    coinpowerImg.onload = () => {
        console.log('coinpower.png loaded');
        imagesLoaded.coinpower = true;
    };
    coinpowerImg.onerror = () => {
        console.error('Failed to load coinpower.png');
        handleImageError(coinpowerImg, 'images/coinpower.png');
    };
    coinpowerImg.src = 'images/coinpower.png';

    // Function to check if all required images are loaded
    function areImagesLoaded() {
        return Object.values(imagesLoaded).every(loaded => loaded);
    }

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
                e.preventDefault();
                e.stopPropagation();
                // Redirect to the home page
                window.location.replace('/');
                return;
            }

            if (isClickInsideButton(x, y, shareButtonArea)) {
                e.preventDefault();
                e.stopPropagation();
                shareScore(shareButtonArea.percentage);
                return;
            }

            if (isClickInsideButton(x, y, downloadButtonArea)) {
                e.preventDefault();
                e.stopPropagation();
                navigateToScorePageForDownload();
                return;
            }

            // Only check top 50% for non-button touches
            if (y > canvas.height / 2) {
                return;
            }

            // Only allow tapping anywhere to restart if not clicking a button
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile && !isClickInsideButton(x, y, playAgainButtonArea) && 
                !isClickInsideButton(x, y, shareButtonArea) && 
                !isClickInsideButton(x, y, downloadButtonArea)) {
                e.preventDefault();
                e.stopPropagation();
                // Redirect to the home page
                window.location.replace('/');
                return;
            }
        }

        // Handle player movement touch logic only if game is running
        if (gameRunning) {
            const touchX = touch.clientX - canvas.getBoundingClientRect().left;
            // Move player to touch position
            const targetX = touchX - (player.width / 2);
            // Keep player within canvas bounds
            player.x = Math.max(0, Math.min(canvas.width - player.width, targetX));
        }
    });

    // Update touchmove to handle continuous movement
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
        } else {
            // Handle player movement during touch
            const touchX = touch.clientX - canvas.getBoundingClientRect().left;
            // Move player to touch position
            const targetX = touchX - (player.width / 2);
            // Keep player within canvas bounds
            player.x = Math.max(0, Math.min(canvas.width - player.width, targetX));
        }
    }, { passive: false });

    // Update touchend to not reset position
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        // No need to reset position on touchend
    });

    // Add game timing variables
    let gameStartTime = 0;
    let lastObstacleTime = 0;
    let obstacleInterval = 1000; // Start with 1 second interval
    let currentSpeedMultiplier = 1;
    let hasReached5000 = false;
    const BASE_OBSTACLE_SPEED = 3; // Base speed for obstacles

    // Function to get current game time in seconds
    function getGameTime() {
        return (Date.now() - gameStartTime) / 1000;
    }

    // Function to determine which obstacle to create based on game time
    function getObstacleType() {
        const gameTime = getGameTime();
        
        // First 10 seconds: only regular obstacles
        if (gameTime < 10) {
            return 'regular';
        }
        
        // After 10 seconds: include me_pa
        if (gameTime < 20) {
            return Math.random() < 0.5 ? 'regular' : 'me_pa';
        }
        
        // After 20 seconds: include me_elon
        if (gameTime < 30) {
            const rand = Math.random();
            if (rand < 0.33) return 'regular';
            if (rand < 0.66) return 'me_pa';
            return 'me_elon';
        }
        
        // After 30 seconds: include me_jerome
        if (gameTime < 40) {
            const rand = Math.random();
            if (rand < 0.25) return 'regular';
            if (rand < 0.5) return 'me_pa';
            if (rand < 0.75) return 'me_elon';
            return 'me_jerome';
        }
        
        // After 40 seconds: include me_thrum
        if (gameTime < 60) {
            const rand = Math.random();
            if (rand < 0.2) return 'regular';
            if (rand < 0.4) return 'me_pa';
            if (rand < 0.6) return 'me_elon';
            if (rand < 0.8) return 'me_jerome';
            return 'me_thrum';
        }
        
        // After 60 seconds: include all types including me_pu
        const rand = Math.random();
        if (rand < 0.16) return 'regular';
        if (rand < 0.32) return 'me_pa';
        if (rand < 0.48) return 'me_elon';
        if (rand < 0.64) return 'me_jerome';
        if (rand < 0.8) return 'me_thrum';
        return 'me_pu';
    }

    // Function to get image for obstacle type
    function getObstacleImage(type) {
        switch(type) {
            case 'me_pa': return mePaImg;
            case 'me_elon': return meElonImg;
            case 'me_jerome': return meJeromeImg;
            case 'me_thrum': return meThrumImg;
            case 'me_pu': return mePuImg;
            default: return mePaImg;
        }
    }

    // Add power-up variables
    let powerUps = [];
    let isPowerActive = false;
    let powerDuration = 0;
    const POWER_DURATION = 10000; // 10 seconds in milliseconds
    const POWER_UP_SIZE = 70; // Size of power-up item
    const SHOT_COINS = 10; // Number of coins to shoot
    let shotCoins = []; // Array to store shot coins
    let shotsRemaining = 0; // Track remaining shots

    // Function to create shot coin
    function createShotCoin(x, y) {
        return {
            x: x,
            y: y,
            width: 50, // Slightly larger size for coinpower
            height: 50,
            speed: 8,
            active: true
        };
    }

    // Function to shoot coins
    function shootCoins() {
        if (shotsRemaining > 0) {
            // Create a new shot coin at player position
            shotCoins.push(createShotCoin(
                player.x + player.width/2 - 15,
                player.y
            ));
            shotsRemaining--;
        }
    }

    // Function to update shot coins
    function updateShotCoins() {
        shotCoins.forEach((coin, coinIndex) => {
            if (!coin.active) return;

            // Move coin upward
            coin.y -= coin.speed;

            // Check for collision with obstacles
            obstacles.forEach((obstacle, obstacleIndex) => {
                // Calculate center points
                const coinCenterX = coin.x + coin.width/2;
                const coinCenterY = coin.y + coin.height/2;
                const obstacleCenterX = obstacle.x + obstacle.width/2;
                const obstacleCenterY = obstacle.y + obstacle.height/2;

                // Calculate distance between centers
                const dx = coinCenterX - obstacleCenterX;
                const dy = coinCenterY - obstacleCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Check for collision
                if (distance < (coin.width/2 + obstacle.width/2)) {
                    // Remove the obstacle
                    obstacles.splice(obstacleIndex, 1);
                    // Deactivate the coin
                    coin.active = false;
                }
            });

            // Remove coin if it goes off screen
            if (coin.y + coin.height < 0) {
                coin.active = false;
            }
        });

        // Remove inactive coins
        shotCoins = shotCoins.filter(coin => coin.active);
    }

    // Function to draw shot coins
    function drawShotCoins() {
        shotCoins.forEach(coin => {
            if (coin.active) {
                ctx.drawImage(coinpowerImg, coin.x, coin.y, coin.width, coin.height);
            }
        });
    }

    // Function to create power-up
    function createPowerUp() {
        // 4% chance to create power-up
        if (Math.random() < 0.04) {
            const POWER_UP_SIZE = 70;
            const MIN_DISTANCE = 150; // Increased minimum distance from obstacles
            const SAFE_ZONE = 100; // Additional safe zone around the power-up
            
            // Try to find a valid position
            let validPosition = false;
            let attempts = 0;
            let x = 0;
            
            while (!validPosition && attempts < 15) { // Increased max attempts
                x = Math.floor(Math.random() * (canvas.width - POWER_UP_SIZE));
                validPosition = true;
                
                // Check if position is too close to edges
                if (x < SAFE_ZONE || x > canvas.width - POWER_UP_SIZE - SAFE_ZONE) {
                    validPosition = false;
                    attempts++;
                    continue;
                }
                
                // Check distance from all obstacles
                for (let obstacle of obstacles) {
                    // Calculate center points
                    const powerUpCenterX = x + POWER_UP_SIZE/2;
                    const powerUpCenterY = 0 + POWER_UP_SIZE/2;
                    const obstacleCenterX = obstacle.x + obstacle.width/2;
                    const obstacleCenterY = obstacle.y + obstacle.height/2;
                    
                    // Calculate distance between centers
                    const dx = powerUpCenterX - obstacleCenterX;
                    const dy = powerUpCenterY - obstacleCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if too close to any obstacle
                    if (distance < MIN_DISTANCE) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }
            
            // Only create power-up if we found a valid position
            if (validPosition) {
                powerUps.push({
                    x,
                    y: 0,
                    width: POWER_UP_SIZE,
                    height: POWER_UP_SIZE,
                    speed: BASE_OBSTACLE_SPEED * currentSpeedMultiplier
                });
            }
        }
    }

    // Function to draw power-ups
    function drawPowerUps() {
        powerUps.forEach(powerUp => {
            ctx.drawImage(coinpowerImg, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        });
    }

    // Function to move power-ups
    function movePowerUps() {
        powerUps.forEach(powerUp => {
            powerUp.y += powerUp.speed;
        });
        // Remove power-ups that are off screen
        powerUps = powerUps.filter(powerUp => powerUp.y < canvas.height);
    }

    // Function to check power-up collection
    function checkPowerUpCollection() {
        if (isPowerActive) return; // Don't collect power-ups while power is active

        powerUps.forEach((powerUp, index) => {
            // Calculate center points
            const playerCenterX = player.x + player.width/2;
            const playerCenterY = player.y + player.height/2;
            const powerUpCenterX = powerUp.x + powerUp.width/2;
            const powerUpCenterY = powerUp.y + powerUp.height/2;

            // Calculate distance between centers
            const dx = playerCenterX - powerUpCenterX;
            const dy = playerCenterY - powerUpCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check for collision
            if (distance < (player.width/2 + powerUp.width/2)) {
                // Activate power
                activatePower();
                // Remove collected power-up
                powerUps.splice(index, 1);
            }
        });
    }

    // Function to activate power
    function activatePower() {
        isPowerActive = true;
        powerDuration = POWER_DURATION;
        shotsRemaining = SHOT_COINS;
        
        // Start shooting coins
        const shootInterval = setInterval(() => {
            if (shotsRemaining > 0 && gameRunning) {
                shootCoins();
            } else {
                clearInterval(shootInterval);
            }
        }, 200); // Shoot every 200ms
        
        // Start power duration timer
        setTimeout(() => {
            isPowerActive = false;
            powerDuration = 0;
            clearInterval(shootInterval);
        }, POWER_DURATION);
    }

    // Update createObstacle function to include power-up creation
    function createObstacle() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const x = Math.floor(Math.random() * (canvas.width - 50));
        const obstacleSize = isMobile ? Math.min(90, canvas.width * 0.2) : 120;
        
        const type = getObstacleType();
        const image = getObstacleImage(type);
        
        obstacles.push({
            x,
            y: 0,
            width: obstacleSize,
            height: obstacleSize,
            speed: BASE_OBSTACLE_SPEED * currentSpeedMultiplier,
            type: type,
            image: image,
            hitbox: {
                width: obstacleSize * 0.33,
                height: obstacleSize * 0.33
            }
        });

        // Try to create power-up
        createPowerUp();
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
      ctx.lineWidth = 2;
      ctx.restore();

      // วาดรูปผู้เล่นตามทิศทางการเคลื่อนที่
      ctx.save();
      
      // Check if we're in death animation
      if (isDying) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - deathAnimationStartTime;
        
        if (elapsedTime < deathAnimationDuration) {
          // Draw death animation
          if (isFacingLeft) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(playerDieImg, 0, 0, player.width, player.height);
          } else {
            ctx.drawImage(playerDieImg, player.x, player.y, player.width, player.height);
          }
        } else {
          // End death animation
          isDying = false;
          // Draw normal player
          if (isFacingLeft) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImg, 0, 0, player.width, player.height);
          } else {
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
          }
        }
      } else {
        // Draw normal player
        if (isFacingLeft) {
          ctx.translate(player.x + player.width, player.y);
          ctx.scale(-1, 1);
          ctx.drawImage(playerImg, 0, 0, player.width, player.height);
        } else {
          ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        }
      }
      ctx.restore();
    }

    function drawObstacles() {
        obstacles.forEach(ob => {
            try {
                if (!ob.image || !ob.image.complete) {
                    console.warn('Skipping obstacle draw - image not loaded');
                    return;
                }

                ctx.save();
                ctx.beginPath();
                ctx.arc(
                    ob.x + ob.width/2,
                    ob.y + ob.height/2,
                    ob.width/2,
                    0,
                    Math.PI * 2
                );
                ctx.lineWidth = 2;
                ctx.restore();

                ctx.drawImage(ob.image, ob.x, ob.y, ob.width, ob.height);
            } catch (error) {
                console.error('Error drawing obstacle:', error);
            }
        });
    }

    function drawScore() {
      ctx.save();
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText("Score: " + score, 20, 40);
      ctx.restore();
    }

    function drawHearts() {
      ctx.save();
      const startX = canvas.width - (heartSize + heartSpacing) * maxHealth - 20;
      const startY = 20;

      for (let i = 0; i < maxHealth; i++) {
        const x = startX + (heartSize + heartSpacing) * i;
        const y = startY;

        // Draw kokokcoin image instead of heart
        if (i < health) {
          // Draw full kokokcoin for remaining health
          ctx.globalAlpha = 1;
        } else {
          // Draw faded kokokcoin for lost health
          ctx.globalAlpha = 0.3;
        }

        // Draw the kokokcoin image
        ctx.drawImage(kokokcoinImg, x, y, heartSize, heartSize);
      }
      ctx.restore();
    }

    function moveObstacles() {
      obstacles.forEach(ob => {
        ob.y += ob.speed;
      });

      // ลบอันที่หลุดจากจอ
      obstacles = obstacles.filter(ob => ob.y < canvas.height);
    }

    function detectCollision() {
      // Skip collision check if player is invincible or dying
      if (isInvincible || isDying) {
        return false;
      }

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
          // Check if enough time has passed since last damage
          const currentTime = Date.now();
          if (currentTime - lastDamageTime >= invincibilityTime) {
            // Clear any existing invincibility timer
            if (invincibilityTimer) {
              clearTimeout(invincibilityTimer);
            }

            // Play oof sound when taking damage
            oofMusic.currentTime = 0; // Reset the sound to start
            oofMusic.play().catch(error => {
                console.error('Error playing oof sound:', error);
            });

            // Start death animation
            isDying = true;
            deathAnimationStartTime = currentTime;

            // Reduce health
            health--;
            lastDamageTime = currentTime;
            
            // Remove the obstacle that caused the collision
            obstacles = obstacles.filter(obs => obs !== ob);
            
            // Make player invincible temporarily
            isInvincible = true;
            invincibilityTimer = setTimeout(() => {
              isInvincible = false;
              invincibilityTimer = null;
            }, invincibilityTime);
            
            // Check if game over
            if (health <= 0) {
              gameRunning = false;
              // Allow percentage over 100% for display
              const percentage = Math.round((score / 1000) * 100);
              
              // Clear any existing invincibility timer
              if (invincibilityTimer) {
                clearTimeout(invincibilityTimer);
                invincibilityTimer = null;
              }
              
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
            }
            return true;
          }
        }
      }
      return false;
    }

    function updateSpeed() {
        // เพิ่มความเร็วทุก 5000 คะแนน แต่จำกัดที่ 3x
        const newMultiplier = Math.min(3, 1 + (Math.floor(score / 5000) * 0.2));
        if (newMultiplier !== speedMultiplier) {
            speedMultiplier = newMultiplier;
            currentSpeedMultiplier = speedMultiplier;
            // อัพเดทความเร็วของสิ่งกีดขวางที่มีอยู่
            obstacles.forEach(ob => {
                ob.speed = BASE_OBSTACLE_SPEED * speedMultiplier;
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
          return;
      }

      // Only continue the game loop if game is running
      if (!gameRunning) {
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

      // Create new obstacles based on time
      const currentTime = Date.now();
      if (currentTime - lastObstacleTime >= obstacleInterval) {
          createObstacle();
          lastObstacleTime = currentTime;
      }

      // Move player and change direction based on movement
      if (left && player.x > 0) {
        player.x -= player.speed;
        isFacingLeft = true;
      }
      if (right && player.x < canvas.width - player.width) {
        player.x += player.speed;
        isFacingLeft = false;
      }

      drawPlayer();
      drawObstacles();
      drawPowerUps();
      drawShotCoins();
      drawScore();
      drawHearts();
      moveObstacles();
      movePowerUps();
      updateShotCoins();
      checkPowerUpCollection();

      // Check for collision
      detectCollision();

      // Request next frame only if game is still running
      if (gameRunning) {
        requestAnimationFrame(draw);
      }
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
                e.preventDefault(); // Prevent default behavior
                e.stopPropagation(); // Stop event propagation
                // Redirect to the home page
                window.location.replace('/');
                return; // Stop processing
            }

            // Check Share button area (always visible when !gameRunning)
            if (isClickInsideButton(x, y, shareButtonArea)) {
                e.preventDefault();
                e.stopPropagation();
                shareScore(shareButtonArea.percentage);
                return;
            }

            // Check Download button area (always visible when !gameRunning)
            if (isClickInsideButton(x, y, downloadButtonArea)) {
                e.preventDefault();
                e.stopPropagation();
                navigateToScorePageForDownload();
                return;
            }
        }
    });

    // Move the shareScore function inside the main game scope
    async function shareScore(displayPercentage) {
      try {
        const apiUrl = window.location.origin;
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('You must be logged in to share your score');
        }

        // Get timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Calculate percentage to send to API (capped at 100 as per backend)
        const percentageToSend = Math.min(Math.max(0, Math.round((score / 1000) * 100)), 100);
        
        // First, save the score to the database and get the score ID
        const response = await fetch(`${apiUrl}/api/scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            score: score,
            percentage: percentageToSend, // Use capped percentage for API
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
        // Use the displayPercentage (potentially > 100) for the share text
        const shareText = `I survived up to ${displayPercentage}% in KOKOK Game! Check out my score: ${scoreUrl}`;

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

            // Calculate percentage to send to API (capped at 100 as per backend)
            const percentageToSend = Math.min(Math.max(0, Math.round((score / 1000) * 100)), 100);

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
                    percentage: percentageToSend, // Use capped percentage for API
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
                if (!sharedScoreData || typeof sharedScoreData.score !== 'number') { // Check for score number
                    console.error('Invalid data format for shared score:', sharedScoreData);
                    sharedScoreData = { score: 0, percentage: 0, error: 'Invalid score data' }; // Ensure score is 0 in error case
                }
            }

        } catch (error) {
            console.error(`Error during fetch for score ${scoreId}:`, error);
            sharedScoreData = { score: 0, percentage: 0, error: 'Network Error' }; // Ensure score is 0 in error case
        }

        // Ensure images are loaded before drawing the final screen
        Promise.all([
            new Promise(resolve => { if (playerImg.complete) resolve(); else playerImg.onload = resolve; }),
            new Promise(resolve => { if (playerDieImg.complete) resolve(); else playerDieImg.onload = resolve; }),
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
            // Use fetched raw score to calculate percentage for display
            const percentageToDisplay = sharedScoreData && typeof sharedScoreData.score === 'number' ? 
                Math.min(100, Math.round((sharedScoreData.score / 1000) * 100)) : 0;
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
                        finalScoreSpan.textContent = `${percentageToDisplay}%`; // Use the uncapped percentage
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
        
        // Hide the login container and show the game container
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        // Check if all images are loaded
        if (!areImagesLoaded()) {
            console.log('Waiting for images to load...');
            // Show loading message
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = "20px Arial";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.fillText("Loading game assets...", canvas.width / 2, canvas.height / 2);
            
            // Wait for images to load with timeout
            const maxWaitTime = 10000; // 10 seconds timeout
            const startTime = Date.now();
            
            const checkImages = setInterval(() => {
                if (areImagesLoaded()) {
                    clearInterval(checkImages);
                    console.log('All images loaded, starting game...');
                    resetGame();
                    resizeCanvas();
                    setInterval(createObstacle, 1000);
                    draw();
                } else if (Date.now() - startTime > maxWaitTime) {
                    clearInterval(checkImages);
                    console.error('Timeout waiting for images to load');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "red";
                    ctx.fillText("Error loading game assets!", canvas.width / 2, canvas.height / 2);
                }
            }, 100);
            return;
        }

        // Play start music
        startMusic.volume = 0.2;
        startMusic.play().catch(error => {
            console.error('Error playing start music:', error);
        });

        resetGame();
        resizeCanvas();
        setInterval(createObstacle, 1000);
        draw();
    }

    // Add back the resetGame function
    function resetGame() {
        console.log('Resetting game...');
        score = 0;
        health = maxHealth;
        isInvincible = false;
        lastDamageTime = 0;
        gameStartTime = Date.now();
        lastObstacleTime = 0;
        currentSpeedMultiplier = 1;
        hasReached5000 = false;
        isFacingLeft = false; // Initialize player facing direction
        
        if (invincibilityTimer) {
            clearTimeout(invincibilityTimer);
            invincibilityTimer = null;
        }
        
        obstacles = [];
        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - player.height - 20;
        gameRunning = true;
        shareButtonArea = null;
        downloadButtonArea = null;
        playAgainButtonArea = null;
        isViewingSharedScore = false;
        sharedScoreData = null;
        powerUps = [];
        burstCoins = [];
        isPowerActive = false;
        powerDuration = 0;

        if (!isMusicPlaying) {
            playMusic();
        }

        if (gameOverText) {
            gameOverText.style.display = 'none';
        }

        if (scoreValueElement) {
            scoreValueElement.textContent = '0';
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawPlayer();
        draw();
    }
}

function handleImageError(img, src) {
  console.error(`Failed to load image: ${src}`);
  // Create a colored rectangle as fallback
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 100, 100);
  img.src = canvas.toDataURL();
}
