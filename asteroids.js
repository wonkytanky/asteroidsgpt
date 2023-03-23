const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//  Initialize the lives variable
let lives = 3;
//  Initialize the level variable
let level = 1;


// Create a function to display the lives remaining
function drawLives() {
    // Set the font and fill style
    ctx.fillStyle = 'white';
    ctx.font = '20px "Press Start 2P"'; // Use an 80s arcade-style font, you can use "Press Start 2P" from Google Fonts
    ctx.fillText(`Lives: `, 10, 30);

	// Set glowing effect
	ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
	ctx.shadowBlur = 10;

    for (let i = 0; i < lives; i++) {
		ctx.fillText(`X `, 140 + i*30, 30);
    }

    // Reset glowing effect
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}


// Create a function to display the current level
function drawLevel() {
    ctx.fillStyle = 'white';
    ctx.font = '20px "Press Start 2P"';
    ctx.fillText(`Level: ${level}`, canvas.width - 170, 30);
}

function initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
}

const audioContext = initAudioContext();

function playBulletSound() {
    const duration = 0.15;

    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(900, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + duration);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playExplosionSound() {
    const duration = 1;
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < audioContext.sampleRate * duration; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1000;
    noiseFilter.Q.value = 0.7;

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + duration);
}

function playCrashSound() {
    const duration = 0.5;

    const oscillator = audioContext.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + duration);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}


const starCount = 200; // Adjust the number of stars

// Generate random stars
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2, // Adjust the size of the stars
    speed: Math.random() * 0.5 + 0.1 // Adjust the speed of the stars
  });
}

// Update and draw stars
function updateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';

  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
    ctx.fill();
  });
}

class Asteroid {
    constructor(x, y, radius, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.velocity = velocity;
        this.points = [];
        this.generatePoints();
    }

    // ...

    generatePoints() {
        const numPoints = 10 + Math.floor(Math.random() * 6);
        const angleStep = (2 * Math.PI) / numPoints;
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep;
            const distance = this.radius * (0.8 + Math.random() * 0.4);
            const x = this.x + distance * Math.cos(angle);
            const y = this.y + distance * Math.sin(angle);
            this.points.push({ x, y });
        }
    }
	
	draw() {
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		for (let i = 1; i < this.points.length; i++) {
			ctx.lineTo(this.points[i].x, this.points[i].y);
		}
		ctx.closePath();
		ctx.stroke();
	}

}



const asteroids = [];

function createAsteroids(numAsteroids, level) {
    for (let i = 0; i < numAsteroids * level; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 15 + 30; // Adjust asteroid size range
        const speed = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1
        };

        asteroids.push(new Asteroid(x, y, radius, speed));
    }
}

// Start the game with initial asteroids
createAsteroids(3, level); // 3 is the base number of asteroids to create, adjust accordingly


const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    rotation: 0,
    thrust: {
        x: 0,
        y: 0
    },
	rotatingLeft: false,
    rotatingRight: false,
    rotationSpeed: 0.05,
    thrusting: false,
    acceleration: 0.05, // Adjust this value for stronger/weaker acceleration
    drag: 0.995 // Adjust this value for more/less drag (inertia)
};

// Particle system for the flame
const particles = [];
const debris = [];

function Particle(x, y, size, speed, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.color = color;
    this.alpha = 1;
}

Particle.prototype.update = function() {
    this.x += this.speed.x;
    this.y -= this.speed.y;
    this.alpha -= 0.015;
};

Particle.prototype.draw = function() {
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
};

function drawFlame() {
    const particleCount = 5;

    for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 4 + 1;
        const angle = ship.rotation + Math.PI;
        const speedMagnitude = Math.random() * 3 + 1;
        const speed = {
            x: Math.cos(angle) * speedMagnitude,
            y: Math.sin(angle) * speedMagnitude
        };
        const color = {
            r: 255,
            g: Math.floor(Math.random() * 155) + 100,
            b: 0
        };
        const x = ship.x - ship.radius * Math.cos(ship.rotation);
        const y = ship.y + ship.radius * Math.sin(ship.rotation);
        particles.push(new Particle(x, y, size, speed, color));
    }

    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.update();
        particle.draw();

        if (particle.alpha <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}



function drawShip() {
    // Main ship body
    ctx.beginPath();
    ctx.moveTo(
        ship.x + ship.radius * Math.cos(ship.rotation),
        ship.y - ship.radius * Math.sin(ship.rotation)
    );
    ctx.lineTo(
        ship.x - ship.radius * (Math.cos(ship.rotation) - Math.sin(ship.rotation) * 0.5),
        ship.y + ship.radius * (Math.sin(ship.rotation) + Math.cos(ship.rotation) * 0.5)
    );
    ctx.lineTo(
        ship.x - ship.radius * (Math.cos(ship.rotation) + Math.sin(ship.rotation) * 0.5),
        ship.y + ship.radius * (Math.sin(ship.rotation) - Math.cos(ship.rotation) * 0.5)
    );
    ctx.closePath();

    // Add gradient to ship body
    const gradient = ctx.createLinearGradient(ship.x - ship.radius, ship.y - ship.radius, ship.x + ship.radius, ship.y + ship.radius);
    gradient.addColorStop(0, '#8cffff');
    gradient.addColorStop(0.5, '#8c88ff');
    gradient.addColorStop(1, '#8c8cff');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add shadow to ship body
    ctx.shadowColor = '#8c8cff';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fill();

    // Draw ship details
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        ship.x - ship.radius * 0.3 * Math.cos(ship.rotation),
        ship.y + ship.radius * 0.3 * Math.sin(ship.rotation),
        ship.radius * 0.15,
        0,
        2 * Math.PI
    );
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Flame effect when thrusting
    if (ship.thrusting) {
        drawFlame();
    }
}

// Add bullets array
const bullets = [];

// Update bullet positions
function updateBullets() {
  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];
    const bulletSize = 2;
    const bulletOpacity = 1;

    // Update bullet position
    bullet.x += bullet.velocity.x;
    bullet.y += bullet.velocity.y;

    // Remove bullets that are off-screen
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(i, 1);
      i--;
    } else {
      // Draw bullet trail
      for (let j = 5; j > 0; j--) {
        const trailSize = bulletSize * j / 5;
        const trailOpacity = bulletOpacity * j / 5;

        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, trailSize, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(0, 255, 0, ${trailOpacity})`;
        ctx.fill();
      }

      // Draw bullet glow
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bulletSize * 5, 0, 2 * Math.PI);
      ctx.fillStyle = "green";
      ctx.globalCompositeOperation = "lighter";
      ctx.filter = "blur(10px)";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";

      // Draw bullet
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bulletSize, 0, 2 * Math.PI);
      ctx.fillStyle = "green";
      ctx.fill();

      // Spawn bullet particles on impact
      const impactThreshold = 2;
      for (let j = 0; j < asteroids.length; j++) {
        const asteroid = asteroids[j];
        const distance = Math.sqrt((bullet.x - asteroid.x) ** 2 + (bullet.y - asteroid.y) ** 2);
        if (distance < asteroid.size + impactThreshold) {
          for (let k = 0; k < 10; k++) {
            const particle = {
              x: bullet.x,
              y: bullet.y,
              velocity: {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4
              },
              size: Math.random() * 4 + 2,
              opacity: 1
            };
            particles.push(particle);
          }
          bullets.splice(i, 1);
          i--;
          asteroids.splice(j, 1);
          j--;
          break;
        }
      }
    }
  }
}

function updateAsteroids() {
    asteroids.forEach(asteroid => {
        asteroid.x += asteroid.velocity.x;
        asteroid.y += asteroid.velocity.y;

        // Update the position of the asteroid points
        asteroid.points.forEach(point => {
            point.x += asteroid.velocity.x;
            point.y += asteroid.velocity.y;
        });

        asteroid.draw();

        // Wrap the asteroids around the canvas edges
        if (asteroid.x < 0 - asteroid.radius) {
            asteroid.x = canvas.width + asteroid.radius;
            asteroid.points.forEach(point => point.x += canvas.width + 2 * asteroid.radius);
        }
        if (asteroid.x > canvas.width + asteroid.radius) {
            asteroid.x = 0 - asteroid.radius;
            asteroid.points.forEach(point => point.x -= canvas.width + 2 * asteroid.radius);
        }
        if (asteroid.y < 0 - asteroid.radius) {
            asteroid.y = canvas.height + asteroid.radius;
            asteroid.points.forEach(point => point.y += canvas.height + 2 * asteroid.radius);
        }
        if (asteroid.y > canvas.height + asteroid.radius) {
            asteroid.y = 0 - asteroid.radius;
            asteroid.points.forEach(point => point.y -= canvas.height + 2 * asteroid.radius);
        }
    });
}

function generateProceduralTexture() {
    const textureCanvas = document.createElement('canvas');
    const textureCtx = textureCanvas.getContext('2d');

    textureCanvas.width = 64;
    textureCanvas.height = 64;

    const gradient = textureCtx.createRadialGradient(32, 32, 8, 32, 32, 32);
    gradient.addColorStop(0, '#777');
    gradient.addColorStop(1, '#333');

    textureCtx.fillStyle = gradient;
    textureCtx.fillRect(0, 0, 64, 64);

    for (let i = 0; i < 150; i++) {
        textureCtx.fillStyle = 'rgba(255, 255, 255, ' + (Math.random() * 0.05 + 0.1) + ')';
        textureCtx.beginPath();
        textureCtx.arc(Math.random() * 64, Math.random() * 64, Math.random() * 2, 0, 2 * Math.PI);
        textureCtx.fill();
    }

    return textureCtx.createPattern(textureCanvas, 'repeat');
}

function drawAsteroids() {
    const pattern = generateProceduralTexture();

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.fillStyle = pattern;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 20;

    asteroids.forEach(asteroid => {
        ctx.beginPath();
        ctx.moveTo(asteroid.points[0].x, asteroid.points[0].y);
        for (let i = 1; i < asteroid.points.length; i++) {
            ctx.lineTo(asteroid.points[i].x, asteroid.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function createExplosion(x, y, numParticles) {
    const explosionParticles = numParticles;

    for (let i = 0; i < explosionParticles; i++) {
        const size = Math.random() * 4 + 1;
        const angle = Math.random() * 2 * Math.PI;
        const speedMagnitude = Math.random() * 5 + 2;
        const speed = {
            x: Math.cos(angle) * speedMagnitude,
            y: Math.sin(angle) * speedMagnitude
        };
		colorLevelOfGray = 50+ Math.random() * 127;
        const color = {
            r: Math.floor(colorLevelOfGray),
            g: Math.floor(colorLevelOfGray),
            b: Math.floor(colorLevelOfGray)
        };
        debris.push(new Particle(x, y, size, speed, color));
    }
}

function updateDebris() {
    for (let i = 0; i < debris.length; i++) {
        const particle = debris[i];
        particle.update();
        particle.draw();

        if (particle.alpha <= 0) {
            debris.splice(i, 1);
            i--;
        }
    }
}

function breakAsteroid(index) {
    const asteroid = asteroids[index];

    playExplosionSound(); // Play sound when an asteroid is hit
    createExplosion(asteroid.x, asteroid.y, asteroid.radius*2); // Create explosion particles

    if (asteroid.radius >= 20) { // Adjust this value to control the minimum size of asteroids
        const pieces = 2;
        for (let i = 0; i < pieces; i++) {
            const newAsteroid = new Asteroid(
                asteroid.x,
                asteroid.y,
                asteroid.radius / 2,
                {
                    x: Math.random() * 2 - 1,
                    y: Math.random() * 2 - 1
                }
            );
            asteroids.push(newAsteroid);
        }
    }

    asteroids.splice(index, 1);
    // Check if there are no more asteroids
    if (asteroids.length === 0) {
        // Advance to the next level
        level++;
        createAsteroids(3, level); // 5 is the base number of asteroids to create, adjust accordingly
    }
}


function circleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
}

function checkCollisions() {
    // Check for collisions between bullets and asteroids
    for (let i = 0; i < bullets.length; i++) {
        for (let j = 0; j < asteroids.length; j++) {
            if (circleCollision(bullets[i], asteroids[j])) {
                // Handle bullet-asteroid collision
                breakAsteroid(j);
                bullets.splice(i, 1);
                i--;
                break;
            }
        }
    }

    // Check for collisions between the spaceship and asteroids
    for (let i = 0; i < asteroids.length; i++) {
        if (circleCollision(ship, asteroids[i])) {
            // Handle spaceship-asteroid collision
            lives--;
            // Break and explode the asteroid
            breakAsteroid(i);

            // Play crash sound
            playCrashSound();

            // Reset spaceship position
            ship.x = canvas.width / 2;
            ship.y = canvas.height / 2;
            ship.thrust.x = 0;
            ship.thrust.y = 0;
			clearInitialPosition();
        }
    }
}

// Add a function to display the "GAME OVER" message
function drawGameOver() {
    const text = 'GAME OVER';

    // Set the font, style, and glowing effect
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.font = '60px "Press Start 2P"'; // Use an 80s arcade-style font, you can use "Press Start 2P" from Google Fonts
    ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
    ctx.shadowBlur = 10;

    // Calculate the position to center the text
    const textWidth = ctx.measureText(text).width;
    const xPos = (canvas.width - textWidth) / 2;
    const yPos = canvas.height / 2;

    // Draw the text
    ctx.fillText(text, xPos, yPos);
    ctx.strokeText(text, xPos, yPos);

    // Reset glowing effect
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// 3. Add a function to check if the initial position of the spaceship is clear from asteroids
function clearInitialPosition() {
    const safeRadius = 100; // Adjust this value to change the safe area around the initial position

    for (let i = 0; i < asteroids.length; i++) {
        const dx = ship.x - asteroids[i].x;
        const dy = ship.y - asteroids[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ship.radius + asteroids[i].radius + safeRadius) {
            // Move asteroid away from the initial position
            asteroids[i].x += (ship.radius + asteroids[i].radius + safeRadius) * 1.1;
            asteroids[i].y += (ship.radius + asteroids[i].radius + safeRadius) * 1.1;
        }
    }
}


function update() {
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if all lives are lost and display the "GAME OVER" message
    if (lives <= 0) {
        drawGameOver();
        return; // Stop the update loop
    }

    updateStars();
    updateAsteroids();
    updateBullets();
    checkCollisions();
    drawAsteroids();
    // Update explosion debris
    updateDebris();
    // Display lives
    drawLives();
    // Display level
    drawLevel();


	
    if (ship.rotatingLeft) {
        ship.rotation += ship.rotationSpeed;
    }

    if (ship.rotatingRight) {
        ship.rotation -= ship.rotationSpeed;
    }


    if (ship.thrusting) {
        ship.thrust.x += ship.acceleration * Math.cos(ship.rotation);
        ship.thrust.y -= ship.acceleration * Math.sin(ship.rotation);
    } else {
        ship.thrust.x *= ship.drag;
        ship.thrust.y *= ship.drag;
    }

    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
	

    if (ship.x < 0 - ship.radius) ship.x = canvas.width + ship.radius;
    if (ship.x > canvas.width + ship.radius) ship.x = 0 - ship.radius;
    if (ship.y < 0 - ship.radius) ship.y = canvas.height + ship.radius;
    if (ship.y > canvas.height + ship.radius) ship.y = 0 - ship.radius;

    drawShip();
    requestAnimationFrame(update);
}

update();

document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp") ship.thrusting = true;
    if (e.code === "ArrowLeft") ship.rotatingLeft = true;
    if (e.code === "ArrowRight") ship.rotatingRight = true;
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowUp") {
        ship.thrusting = false;
        particles.length = 0; // Clear the particles array
    }
    if (e.code === "ArrowLeft") ship.rotatingLeft = false;
    if (e.code === "ArrowRight") ship.rotatingRight = false;
});

// Add event listener for firing bullets
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        // Fire a bullet
        const bulletSpeed = 5;
        const angle = ship.rotation;
        const velocity = {
            x: Math.cos(angle) * bulletSpeed + ship.thrust.x,
            y: -Math.sin(angle) * bulletSpeed + ship.thrust.y
        };
        const bullet = {
            x: ship.x + ship.radius * Math.cos(angle),
            y: ship.y - ship.radius * Math.sin(angle),
            radius: 2,
            velocity: velocity
        };
        bullets.push(bullet);
        playBulletSound();
        e.preventDefault();
    }
});
