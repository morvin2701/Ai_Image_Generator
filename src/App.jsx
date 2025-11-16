import { useState, useEffect } from 'react';
import EditScreen from './EditScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('generator'); // 'generator' or 'editor'
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [imageCount, setImageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTokens, setAvailableTokens] = useState(1000);
  const [usedTokens, setUsedTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(1000);
  const [darkMode, setDarkMode] = useState(true);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [recentImages, setRecentImages] = useState([]);
  const [showRecent, setShowRecent] = useState(false);

  // Gemini API configuration
  const GEMINI_API_KEY = 'AIzaSyB9slH0K_FDyTZbkshXkv_uTPcMalzz7Jc';
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict';

  // Trendy prompt suggestions
  const promptSuggestions = [
    "A futuristic cityscape at sunset with flying cars",
    "A cute robot cat playing piano in a jazz club",
    "An underwater castle surrounded by glowing jellyfish",
    "A steampunk library with mechanical birds and gears",
    "A magical forest with floating lanterns and unicorns",
    "A cyberpunk marketplace with neon signs and holograms",
    "A cozy cabin in the mountains during winter",
    "A space station orbiting a colorful nebula"
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

  // Save token usage and recent images to localStorage
  useEffect(() => {
    localStorage.setItem('usedTokens', usedTokens.toString());
    localStorage.setItem('generatedCount', generatedCount.toString());
    localStorage.setItem('recentImages', JSON.stringify(recentImages));
  }, [usedTokens, generatedCount, recentImages]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setImageUrls([]);
    
    try {
      // Calculate tokens needed for this request
      const tokensNeeded = imageCount * 50;
      
      // Check if we have enough tokens
      if (tokensNeeded > availableTokens) {
        throw new Error(`Insufficient tokens. You need ${tokensNeeded} tokens but only have ${availableTokens} available.`);
      }
      
      // Call Gemini API for image generation
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: prompt,
            },
          ],
          parameters: {
            sampleCount: imageCount,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Extract the base64 encoded images from the response
      if (data.predictions && data.predictions.length > 0) {
        const urls = data.predictions.slice(0, imageCount).map(prediction => {
          if (prediction.bytesBase64Encoded) {
            return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
          }
          return null;
        }).filter(url => url !== null);
        
        setImageUrls(urls);
        setGeneratedCount(prev => prev + urls.length);
        
        // Update token usage
        const newUsedTokens = usedTokens + tokensNeeded;
        setUsedTokens(newUsedTokens);
        setAvailableTokens(totalTokens - newUsedTokens);
        
        // Add to recent images
        const newImages = urls.map((url, index) => ({
          id: Date.now() + index,
          url: url,
          prompt: prompt,
          timestamp: new Date().toLocaleString()
        }));
        
        setRecentImages(prev => [...newImages, ...prev].slice(0, 20)); // Keep only last 20 images
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      setError(`Failed to generate image: ${err.message}`);
      console.error('Error generating image:', err);
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
    setDarkMode(!darkMode);
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
    return <EditScreen onNavigateToGenerator={goToGenerator} />;
  }

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <div className="header-content">
          <div className="title-section">
            <h1>AI Image Generator</h1>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button className="recent-toggle" onClick={() => setShowRecent(!showRecent)}>
              {showRecent ? 'Hide Recent' : 'Show Recent'}
            </button>
            <button className="edit-toggle" onClick={goToEditor}>
              🖌️ Edit Images
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
              {loading ? 'Generating...' : 'Generate'}
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
          
          {/* Token information with progress bar */}
          <div className="token-info-container">
            <div className="token-header">
              <h3>Token Usage</h3>
            </div>
            
            <div className="token-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${tokenUsagePercentage}%`,
                    backgroundColor: tokenUsagePercentage > 80 ? '#ff6b6b' : '#00dbde'
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
          <h3>Trending Prompts</h3>
          <div className="suggestions-container">
            {promptSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-card"
                onClick={() => useSuggestion(suggestion)}
                disabled={loading}
              >
                <span className="suggestion-number">#{index + 1}</span>
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Images Section */}
        {showRecent && (
          <div className="recent-section">
            <div className="recent-header">
              <h3>Recent Images</h3>
              <button className="clear-recent" onClick={clearRecentImages}>Clear All</button>
            </div>
            {recentImages.length > 0 ? (
              <div className="image-gallery">
                {recentImages.map((image) => (
                  <div key={image.id} className="image-container">
                    <div className="image-header">
                      <span className="image-title">Recent Image</span>
                      <span className="image-timestamp">{image.timestamp}</span>
                    </div>
                    <img 
                      src={image.url} 
                      alt={`Generated AI - ${image.prompt}`} 
                      className="generated-image"
                    />
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
                        Download
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
          {imageUrls.length > 0 ? (
            <div className="image-gallery">
              {imageUrls.map((url, index) => (
                <div key={index} className="image-container">
                  <div className="image-header">
                    <span className="image-title">Generated Image {index + 1}</span>
                  </div>
                  <img 
                    src={url} 
                    alt={`Generated AI ${index + 1}`} 
                    className="generated-image"
                  />
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
                      Download
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
                  </div>
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