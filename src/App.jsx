import { useState, useEffect } from 'react';
import EditScreen from './EditScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'generator' or 'editor'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState(''); // New state for API key
  const [loginError, setLoginError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // For drawer menu
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [imageCount, setImageCount] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // New state for aspect ratio
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTokens, setAvailableTokens] = useState(1000);
  const [usedTokens, setUsedTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(1000);
  const [darkMode, setDarkMode] = useState(true);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [recentImages, setRecentImages] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  
  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    // Simple validation - in a real app, you would authenticate with a server
    if (username === 'abc' && password === '123') {
      // Save API key to localStorage
      if (apiKey) {
        localStorage.setItem('geminiApiKey', apiKey);
      }
      setCurrentScreen('generator');
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentScreen('login');
    setUsername('');
    setPassword('');
  };

  // Gemini API configuration
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('geminiApiKey') || '';
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict';

  // Trendy prompt suggestions
  const promptSuggestions = [
  // --- CATEGORY: 3D & CUTE ---
  {
    id: 1,
    label: "3D Isometric Room",
    category: "3D Art",
    prompt: "A cozy isometric living room with a fireplace, soft pastel colors, low poly style, warm lighting, 3D render, high detail, trending on ArtStation"
  },
  {
    id: 2,
    label: "Cute Robot Jazz",
    category: "Characters",
    prompt: "A cute glossy robot cat playing a saxophone in a dimly lit vintage jazz club, cinematic lighting, bokeh effect, Pixar style 3D render"
  },
  {
    id: 3,
    label: "Vinyl Toy Figure",
    category: "Characters",
    prompt: "A collectible vinyl toy figure of a samurai wearing streetwear, vibrant colors, studio lighting, clean background, Pop Mart style"
  },

  // --- CATEGORY: SCENIC & FANTASY ---
  {
    id: 4,
    label: "Cyberpunk Market",
    category: "Sci-Fi",
    prompt: "A bustling cyberpunk night market, neon signs in Japanese, rain-slicked streets, volumetric fog, holographic advertisements, photorealistic, 8k"
  },
  {
    id: 5,
    label: "Floating Islands",
    category: "Fantasy",
    prompt: "Majestic floating islands in the sky connected by waterfalls, golden hour sunlight, dreamlike atmosphere, Studio Ghibli art style"
  },
  {
    id: 6,
    label: "Bioluminescent Ocean",
    category: "Nature",
    prompt: "Deep underwater castle surrounded by glowing jellyfish and bioluminescent coral reefs, deep blue and neon pink color palette, 4k realistic"
  },

  // --- CATEGORY: ARTISTIC & ABSTRACT ---
  {
    id: 7,
    label: "Liquid Gold Wave",
    category: "Abstract",
    prompt: "Abstract fluid art, swirling waves of liquid gold and black marble, glossy texture, macro photography, luxury background"
  },
  {
    id: 8,
    label: "Paper Cutout Art",
    category: "Artistic",
    prompt: "Layered paper cutout art of a mountain landscape at sunset, intricate details, shadow depth, craft paper texture, soft lighting"
  },
  {
    id: 9,
    label: "Steampunk Library",
    category: "Sci-Fi",
    prompt: "A grand steampunk library with brass gears, mechanical birds, steam pipes, leather books, warm amber lighting, intricate Victorian architecture"
  },
  {
    id: 10,
    label: "Cosmic Nebula",
    category: "Space",
    prompt: "A space station orbiting a colorful nebula, vibrant purples and oranges, cinematic composition, epic scale, sci-fi concept art"
  },
  
  // --- CATEGORY: PHOTOGRAPHY ---
  {
    id: 11,
    label: "Fashion Portrait",
    category: "Photography",
    prompt: "Double exposure portrait of a woman and a forest, misty atmosphere, artistic, surreal, high contrast, black and white photography"
  },
  {
    id: 12,
    label: "Macro Eye",
    category: "Photography",
    prompt: "Extreme macro close-up of a human eye reflecting a galaxy, hyper-realistic, incredible detail, sharp focus, 8k resolution"
  }
];

  // Aspect ratio options
  const aspectRatios = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:4', label: '3:4 (Vertical)' }
  ];

  // Initialize with token data and recent images
  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      // Apply theme to body
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
    }
    
    // Initialize API key from localStorage
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Initialize tokens from localStorage or use defaults
    const savedUsedTokens = localStorage.getItem('usedTokens');
    const savedGeneratedCount = localStorage.getItem('generatedCount');
    const savedRecentImages = localStorage.getItem('recentImages');
    
    if (savedUsedTokens) {
      const used = parseInt(savedUsedTokens, 10);
      setUsedTokens(used);
      setAvailableTokens(totalTokens - used);
    }
    
    if (savedGeneratedCount) {
      setGeneratedCount(parseInt(savedGeneratedCount, 10));
    }
    
    if (savedRecentImages) {
      setRecentImages(JSON.parse(savedRecentImages));
    }
  }, []);

  // Apply theme class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Handle aspect ratio for browsers that don't support CSS aspect-ratio
  useEffect(() => {
    const handleAspectRatioFallback = () => {
      const images = document.querySelectorAll('.generated-image[data-aspect-ratio]');
      images.forEach(img => {
        // Check if browser supports aspect-ratio
        if (!window.CSS || !window.CSS.supports('aspect-ratio', '1 / 1')) {
          const aspectRatio = img.getAttribute('data-aspect-ratio');
          if (aspectRatio) {
            const ratios = aspectRatio.split(':');
            if (ratios.length === 2) {
              const widthRatio = parseInt(ratios[0], 10);
              const heightRatio = parseInt(ratios[1], 10);
              if (widthRatio && heightRatio) {
                const container = img.closest('.image-display-container');
                if (container) {
                  // Set padding-top to maintain aspect ratio
                  const percentage = (heightRatio / widthRatio) * 100;
                  container.style.position = 'relative';
                  container.style.paddingTop = `${percentage}%`;
                  container.style.height = '0';
                  img.style.position = 'absolute';
                  img.style.top = '0';
                  img.style.left = '0';
                  img.style.width = '100%';
                  img.style.height = '100%';
                }
              }
            }
          }
        }
      });
    };

    // Run on initial load and when images change
    handleAspectRatioFallback();
    
    // Also run when window is resized
    window.addEventListener('resize', handleAspectRatioFallback);
    
    return () => {
      window.removeEventListener('resize', handleAspectRatioFallback);
    };
  }, [imageUrls, recentImages]);

  // Save token usage and recent images to localStorage
  useEffect(() => {
    localStorage.setItem('usedTokens', usedTokens.toString());
    localStorage.setItem('generatedCount', generatedCount.toString());
    localStorage.setItem('recentImages', JSON.stringify(recentImages));
  }, [usedTokens, generatedCount, recentImages]);

  const generateImage = async () => {
    // Validate input
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Validate API key
    if (!GEMINI_API_KEY) {
      setError('API key is missing. Please add your Gemini API key either in the .env file or enter it on the login screen. Get your API key from https://aistudio.google.com/');
      return;
    }

    // Validate image count
    if (imageCount < 1 || imageCount > 4) {
      setError('Please select a valid number of images (1-4)');
      return;
    }
    
    // Additional validation for API limits
    if (imageCount > 1) {
      console.log('Generating multiple images:', imageCount);
    }

    // Validate aspect ratio
    if (!aspectRatio) {
      setError('Please select a valid aspect ratio');
      return;
    }

    setLoading(true);
    setError('');
    setImageUrls([]);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout. The server is taking too long to respond. Please try again.')), 60000) // 60 second timeout
    );
    
    try {
      // Calculate tokens needed for this request
      const tokensNeeded = imageCount * 50;
      
      // Check if we have enough tokens
      if (tokensNeeded > availableTokens) {
        throw new Error(`Insufficient tokens. You need ${tokensNeeded} tokens but only have ${availableTokens} available.`);
      }
      
      // Call Gemini API for image generation with timeout
      const requestBody = {
        instances: [
          {
            prompt: prompt.trim(),
          },
        ],
        parameters: {
          sampleCount: imageCount,
          // Add aspect ratio parameter
          aspectRatio: aspectRatio
        },
      };
      
      console.log('Sending request to API with aspect ratio:', aspectRatio);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const fetchPromise = fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', JSON.stringify(data, null, 2));
      
      // Extract the base64 encoded images from the response
      console.log('API response structure:', JSON.stringify(data, null, 2));
      
      if (data.predictions && data.predictions.length > 0) {
        // Handle both single prediction with multiple images and multiple predictions
        let allImages = [];
        
        // Check if we have a single prediction with multiple images
        if (data.predictions[0] && data.predictions[0].images) {
          // New API format with images array
          console.log('Using new API format with images array');
          allImages = data.predictions[0].images.slice(0, imageCount).map(image => {
            if (image.bytesBase64Encoded) {
              return `data:image/png;base64,${image.bytesBase64Encoded}`;
            }
            return null;
          }).filter(url => url !== null);
        } else {
          // Old format with multiple predictions
          console.log('Using old API format with multiple predictions');
          allImages = data.predictions.slice(0, imageCount).map(prediction => {
            if (prediction.bytesBase64Encoded) {
              return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
            }
            return null;
          }).filter(url => url !== null);
        }
        
        console.log('Extracted images:', allImages);
        
        if (allImages.length === 0) {
          console.error('No valid images extracted from API response');
          throw new Error(`No valid images were generated for aspect ratio ${aspectRatio}. Please try a different prompt or aspect ratio.`);
        }
        
        // Additional validation to ensure we have the expected number of images
        if (allImages.length < imageCount) {
          console.warn(`Expected ${imageCount} images but only received ${allImages.length}`);
        }
        
        setImageUrls(allImages);
        setGeneratedCount(prev => prev + allImages.length);
        
        // Update token usage
        const newUsedTokens = usedTokens + tokensNeeded;
        setUsedTokens(newUsedTokens);
        setAvailableTokens(totalTokens - newUsedTokens);
        
        // Add to recent images
        const newImages = allImages.map((url, index) => ({
          id: Date.now() + index,
          url: url,
          prompt: prompt,
          timestamp: new Date().toLocaleString(),
          aspectRatio: aspectRatio
        }));
        
        setRecentImages(prev => [...newImages, ...prev].slice(0, 20)); // Keep only last 20 images
      } else {
        throw new Error(`Invalid response format from API for aspect ratio ${aspectRatio}. Please try again with a different aspect ratio or prompt.`);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(`Failed to generate image: ${err.message}`);
      // Ensure we show the error to the user
      setImageUrls([]); // Clear any partial results
      
      // Log additional debugging information
      console.error('Current state:', {
        prompt,
        imageCount,
        aspectRatio,
        availableTokens,
        GEMINI_API_KEY: GEMINI_API_KEY ? 'SET' : 'NOT SET'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      generateImage();
    }
  };

  const useSuggestion = (suggestion) => {
    setPrompt(suggestion);
  };

  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Calculate token usage percentage for progress bar
  const tokenUsagePercentage = totalTokens > 0 ? (usedTokens / totalTokens) * 100 : 0;

  // Clear recent images
  const clearRecentImages = () => {
    setRecentImages([]);
  };

  // Navigation functions
  const goToEditor = () => {
    setCurrentScreen('editor');
  };

  const goToGenerator = () => {
    setCurrentScreen('generator');
  };

  // Show EditScreen if currentScreen is 'editor'
  if (currentScreen === 'editor') {
    return <EditScreen onNavigateToGenerator={goToGenerator} geminiApiKey={GEMINI_API_KEY} darkMode={darkMode} onToggleTheme={toggleTheme} />;
  }

  // Show Login screen if currentScreen is 'login'
  if (currentScreen === 'login') {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">DataCare Softech</h1>
              <p className="login-subtitle">Sign in to your account</p>
            </div>
            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label className="input-label">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  required
                />
              </div>
              
              <div className="api-key-section">
                <div className="api-key-header">
                  <h3 className="api-key-title">Gemini API Key</h3>
                  <button 
                    type="button" 
                    className="api-key-info-button"
                    onClick={() => alert('Get your Gemini API key from Google AI Studio at https://aistudio.google.com/\n\n1. Visit the link above\n2. Sign in with your Google account\n3. Create a new API key\n4. Copy and paste it here or in your .env file')}
                  >
                    ℹ️
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="login-input api-key-input"
                />
                <p className="api-key-note">Enter your Gemini API key to enable image generation</p>
              </div>
              
              {loginError && <div className="error-message">{loginError}</div>}
              <button type="submit" className="login-button">
                Sign In
              </button>
            </form>
            <div className="login-footer">
              <p>Default credentials: abc / 123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Drawer Menu */}
      {isMenuOpen && (
        <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Menu</h2>
              <button className="drawer-close" onClick={() => setIsMenuOpen(false)}>
                ×
              </button>
            </div>
            <div className="drawer-content">
              <button className="drawer-item" onClick={() => { setCurrentScreen('generator'); setIsMenuOpen(false); }}>
                🏠 Home
              </button>
              <button className="drawer-item" onClick={() => { goToEditor(); setIsMenuOpen(false); }}>
                🖌️ Edit Images
              </button>
              <button className="drawer-item" onClick={() => { toggleTheme(); setIsMenuOpen(false); }}>
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button className="drawer-item" onClick={() => { setShowRecent(!showRecent); setIsMenuOpen(false); }}>
                {showRecent ? '📚 Hide Recent' : '📚 Show Recent'}
              </button>
              <button className="drawer-item logout-item" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <div className="title-section">
            <button className="menu-icon" onClick={() => setIsMenuOpen(true)}>
              ☰
            </button>
            <h1 className="app-title">DataCare Softech</h1>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button className="recent-toggle" onClick={() => setShowRecent(!showRecent)}>
              {showRecent ? '📚 Hide' : '📚 Show'}
            </button>
            <button className="edit-toggle" onClick={goToEditor}>
              🖌️ Edit
            </button>
            <button className="logout-button" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="input-section">
          <div className="input-group">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the image you want to generate..."
              disabled={loading}
              className="prompt-input"
            />
            <button 
              onClick={generateImage} 
              disabled={loading}
              className="generate-button"
            >
              {loading ? '⏳ Generating...' : '✨ Generate'}
            </button>
          </div>
          
          {/* Image count selector */}
          <div className="image-count-selector">
            <label>Number of images:</label>
            <div className="counter">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  className={`count-button ${imageCount === count ? 'active' : ''}`}
                  onClick={() => setImageCount(count)}
                  disabled={loading}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          
          {/* Aspect Ratio Selector */}
          <div className="aspect-ratio-selector">
            <label>Aspect Ratio:</label>
            <div className="aspect-ratio-options">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  className={`aspect-ratio-button ${aspectRatio === ratio.value ? 'active' : ''}`}
                  onClick={() => setAspectRatio(ratio.value)}
                  disabled={loading}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Token information with progress bar */}
          <div className="token-info-container">
            <div className="token-header">
              <h3>📊 Token Usage</h3>
            </div>
            
            <div className="token-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${tokenUsagePercentage}%`,
                  }}
                ></div>
              </div>
              <div className="token-stats">
                <span className="used-tokens">{usedTokens} used</span>
                <span className="available-tokens">{availableTokens} available</span>
                <span className="total-tokens">{totalTokens} total</span>
              </div>
            </div>
            
            <div className="token-details">
              <div className="token-item">
                <span className="token-label">This Request:</span>
                <span className="token-value">{imageCount * 50} tokens</span> 
              </div>
              <div className="token-item">
                <span className="token-label">Images Generated:</span>
                <span className="token-value">{generatedCount}</span>
              </div>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Prompt suggestions */}
        <div className="suggestions-section">
          <h3>💡 Trending Prompts</h3>
          <div className="suggestions-container">
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                className="suggestion-card"
                onClick={() => useSuggestion(suggestion.prompt)}
                disabled={loading}
              >
                <span className="suggestion-number">#{suggestion.id}</span>
                <span className="suggestion-label">{suggestion.label}</span>
                <span className="suggestion-category">{suggestion.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Images Section */}
        {showRecent && (
          <div className="recent-section">
            <div className="recent-header">
              <h3>🕒 Recent Images</h3>
              <button className="clear-recent" onClick={clearRecentImages}>🗑️ Clear All</button>
            </div>
            {recentImages.length > 0 ? (
              <div className="image-gallery">
                {recentImages.map((image) => (
                  <div key={image.id} className="image-container">
                    <div className="image-header">
                      <span className="image-title">Recent Image</span>
                      <span className="image-timestamp">{image.timestamp}</span>
                    </div>
                    <div className="image-display-container">
                      <img 
                        src={image.url} 
                        alt={`Generated AI - ${image.prompt}`} 
                        className="generated-image"
                        data-aspect-ratio={image.aspectRatio || '1:1'}
                      />
                    </div>
                    <div className="image-prompt">
                      <p>{image.prompt}</p>
                    </div>
                    <div className="image-actions">
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = image.url;
                          link.download = `ai-generated-image-${image.id}.png`;
                          link.click();
                        }}
                        className="download-button"
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-container">
                <div className="empty-state">
                  <div className="placeholder-icon">🖼️</div>
                  <p>No recent images found</p>
                  <p className="subtext">Generate some images to see them here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Generation Output */}
        <div className="output-section">
          {error && <div className="error-message">{error}</div>}
          {imageUrls.length > 0 ? (
            <div className="image-gallery">
              {imageUrls.map((url, index) => (
                <div key={index} className="image-container">
                  <div className="image-header">
                    <span className="image-title">Generated Image {index + 1}</span>
                    <span className="image-aspect-ratio">{aspectRatio}</span>
                  </div>
                  <div className="image-display-container">
                    <img 
                      src={url} 
                      alt={`Generated AI ${index + 1}`} 
                      className="generated-image"
                      data-aspect-ratio={aspectRatio}
                    />
                  </div>
                  <div className="image-prompt">
                    <p>{prompt}</p>
                  </div>
                  <div className="image-actions">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `ai-generated-image-${index + 1}.png`;
                        link.click();
                      }}
                      className="download-button"
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder-container">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Creating your masterpiece{imageCount > 1 ? ` (${imageCount} images)` : ''}...</p>
                  <div className="loading-details">
                    <p>Using {imageCount * 50} tokens for this request</p>
                    <p>Aspect Ratio: {aspectRatio}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="empty-state">
                  <div className="placeholder-icon">⚠️</div>
                  <p>{error}</p>
                  <p className="subtext">Please try again with a different prompt</p>
                  <button className="generate-button" onClick={() => setError('')} style={{ marginTop: '1rem' }}>
                    Clear Error
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="placeholder-icon">🎨</div>
                  <p>Enter a prompt to generate AI images</p>
                  <p className="subtext">Select how many images you want (1-4)</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;