class Auth {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('token');
    this.isCheckingAuth = false;
    
    // Debug current page info
    console.log('=== PAGE INFO ===');
    console.log('Current origin:', window.location.origin);
    console.log('Current path:', window.location.pathname);
    console.log('Auth token in storage:', this.token ? 'present' : 'missing');
    console.log('=================');
    
    this.checkAuth();
  }

  async checkAuth() {
    // Prevent multiple concurrent auth checks
    if (this.isCheckingAuth) return;
    
    this.isCheckingAuth = true;
    console.log('Checking authentication status...');
    
    if (this.token) {
      try {
        console.log('Token found, validating with server...');
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Authentication successful:', data);
          this.user = data.user;
          this.updateUI();
        } else {
          console.warn('Token validation failed:', response.status);
          this.clearAuth();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        this.clearAuth();
      } finally {
        this.isCheckingAuth = false;
      }
    } else {
      console.log('No token found');
      this.clearAuth();
      this.isCheckingAuth = false;
    }
  }

  // Helper methods for consistent page checks
  isLoginPage() {
    return window.location.pathname === '/' || 
           window.location.pathname === '/index.html';
  }

  // Separate method to clear auth state without redirecting
  clearAuth() {
    console.log('Clearing authentication state');
    this.user = null;
    this.token = null;
    localStorage.removeItem('token');
    this.updateUI();
  }

  async loginWithGoogle(credential) {
    try {
      console.log('Attempting to login with Google credential:', credential ? 'present' : 'missing');
      
      if (!credential) {
        console.error('No credential provided');
        return false;
      }
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: credential })
      });

      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      this.user = data.user;
      this.token = data.token;
      localStorage.setItem('token', this.token);
      this.updateUI();
      
      // After successful login, stay on index.html and show menu
      console.log('Login successful, showing menu options');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  logout() {
    console.log('Logging out...');
    this.clearAuth();
  }

  updateUI() {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const userInfo = document.getElementById('userInfo');
    const gameButton = document.getElementById('gameButton');
    const playNowButton = document.getElementById('playNowButton');
    const scoresButton = document.getElementById('scoresButton');
    const loginPrompt = document.getElementById('loginPrompt');

    if (this.user) {
      console.log('Updating UI for logged in user:', this.user.name);
      if (loginButton) loginButton.style.display = 'none';
      if (logoutButton) logoutButton.style.display = 'block';
      if (userInfo) {
        userInfo.textContent = `Welcome, ${this.user.name}!`;
        userInfo.style.display = 'block';
      }
      if (gameButton) gameButton.style.display = 'block';
      if (playNowButton) playNowButton.style.display = 'none';
      if (scoresButton) scoresButton.style.display = 'block';
      if (loginPrompt) loginPrompt.style.display = 'none';
    } else {
      console.log('Updating UI for logged out state');
      if (loginButton) loginButton.style.display = 'block';
      if (logoutButton) logoutButton.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
      if (gameButton) gameButton.style.display = 'none';
      if (playNowButton) playNowButton.style.display = 'block';
      if (scoresButton) scoresButton.style.display = 'none';
      if (loginPrompt) loginPrompt.style.display = 'block';
    }
    
    // After updating element visibility, trigger the main UI update in index.html
    if (window.showMenuAndLoadScores) {
        console.log('Calling showMenuAndLoadScores from auth.js');
        window.showMenuAndLoadScores();
    } else {
        console.warn('showMenuAndLoadScores function not found on window object.');
    }
  }

  isAuthenticated() {
    return !!this.user;
  }
}

// Initialize auth
const auth = new Auth();

// Set up Google Sign-In with better debugging
window.onGoogleLibraryLoad = () => {
  console.log('Google Sign-In library loaded');
  
  // Debug Google Sign-In configuration
  console.log('Google Sign-In is initializing with domain:', window.location.origin);
  
  google.accounts.id.initialize({
    client_id: '188046080865-5mvhf8rgsf7mn5ev50vhh4qvqgufpbtu.apps.googleusercontent.com',
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
    error_callback: (error) => {
      console.error('Google Sign-In error:', error);
    }
  });
  
  // Log successful initialization
  console.log('Google Sign-In initialized');
  
  // Render button with debug callback
  const buttonContainer = document.getElementById('loginButton');
  if (buttonContainer) {
    console.log('Found login button container:', buttonContainer);
    google.accounts.id.renderButton(
      buttonContainer,
      { 
        theme: 'outline', 
        size: 'large',
        text: 'signin_with'
      }
    );
    console.log('Button rendered');
  } else {
    console.error('Login button container not found!');
  }
};

function handleCredentialResponse(response) {
  console.log('Received Google credential response:', response ? 'present' : 'missing');
  if (response && response.credential) {
    auth.loginWithGoogle(response.credential);
  } else {
    console.error('Invalid credential response:', response);
  }
}

// Load Google Sign-In script
function loadGoogleScript() {
  console.log('Loading Google Sign-In script...');
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing auth...');
  loadGoogleScript();
  
  // Add logout button event listener
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => auth.logout());
  }
  
  // Make sure game button uses proper navigation
  const gameButton = document.getElementById('gameButton');
  if (gameButton) {
    console.log('Adding event listener to game button');
    gameButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Game button clicked, auth status:', auth.isAuthenticated());
      
      if (auth.isAuthenticated()) {
        console.log('User is authenticated, starting game');
        // Start the game directly from index.html
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        // Initialize game here
        startGame();
      }
    });
  } else {
    console.log('Game button not found in DOM');
  }

  // Add Play Now button event listener
  const playNowButton = document.getElementById('playNowButton');
  if (playNowButton) {
    console.log('Adding event listener to Play Now button');
    playNowButton.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Play Now button clicked');
      // Start the game without authentication
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('gameContainer').style.display = 'block';
      startGame();
    });
  } else {
    console.log('Play Now button not found in DOM');
  }
});