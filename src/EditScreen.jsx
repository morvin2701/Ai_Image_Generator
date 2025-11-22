import { useState, useRef, useEffect } from 'react';
import './EditScreen.css';

function EditScreen({ onNavigateToGenerator, geminiApiKey, darkMode: initialDarkMode, onToggleTheme }) {
  const [originalImage, setOriginalImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [aiGeneratedPrompt, setAiGeneratedPrompt] = useState(''); // For AI-generated prompts
  const [editMode, setEditMode] = useState('manual'); // 'manual' or 'auto'
  const [availableTokens, setAvailableTokens] = useState(1000);
  const [usedTokens, setUsedTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(1000);
  const [aspectRatio, setAspectRatio] = useState('1:1'); // New state for aspect ratio
  const fileInputRef = useRef(null);
  
  // Aspect ratio options
  const aspectRatios = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '3:4', label: '3:4 (Vertical)' }
  ];
  
  // Use prop if provided, otherwise get from localStorage
  const darkMode = initialDarkMode !== undefined 
    ? initialDarkMode 
    : (localStorage.getItem('theme') === 'dark' || localStorage.getItem('theme') !== 'light');

  // Use the API key passed from the parent component
  const GEMINI_API_KEY = geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('geminiApiKey') || 'AIzaSyAkzLWnwb9zK9mV2w78qzH_M_mqVUztZII';

  // Initialize tokens from localStorage
  useEffect(() => {
    const savedUsedTokens = localStorage.getItem('usedTokens') || '0';
    const savedTotalTokens = localStorage.getItem('totalTokens') || '1000';
    
    const used = parseInt(savedUsedTokens, 10);
    const total = parseInt(savedTotalTokens, 10);
    
    setUsedTokens(used);
    setTotalTokens(total);
    setAvailableTokens(total - used);
  }, []);

  // Apply theme class to body when darkMode prop changes
  useEffect(() => {
    const currentDarkMode = initialDarkMode !== undefined 
      ? initialDarkMode 
      : (localStorage.getItem('theme') === 'dark' || localStorage.getItem('theme') !== 'light');
      
    if (currentDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [initialDarkMode]);

  // Handle aspect ratio for browsers that don't support CSS aspect-ratio
  useEffect(() => {
    const handleAspectRatioFallback = () => {
      const images = document.querySelectorAll('.preview-image[data-aspect-ratio]');
      images.forEach(img => {
        // Check if browser supports aspect-ratio
        if (!window.CSS || !window.CSS.supports('aspect-ratio', '1 / 1')) {
          const aspectRatio = img.getAttribute('data-aspect-ratio');
          if (aspectRatio && aspectRatio !== 'auto') {
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
  }, [originalImage, editedImage]);

  // Save tokens to localStorage
  useEffect(() => {
    localStorage.setItem('usedTokens', usedTokens.toString());
    localStorage.setItem('totalTokens', totalTokens.toString());
  }, [usedTokens, totalTokens]);

  // Toggle theme function - always use parent's toggle function
  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setShowEditPanel(true);
        setEditedImage(null);
        setPrompt('');
        setAiGeneratedPrompt('');
        setEditMode('manual');
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please upload a JPG, PNG, or WEBP image.');
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Auto-enhance background using Gemini AI (two-step process)
  const autoEnhanceBackground = async () => {
    if (!originalImage) return;

    // Check token availability (auto-enhance uses 100 tokens)
    const tokensNeeded = 100;
    if (tokensNeeded > availableTokens) {
      setError(`Insufficient tokens. You need ${tokensNeeded} tokens but only have ${availableTokens} available.`);
      return;
    }

    setLoading(true);
    setError('');
    setEditMode('auto');
    
    try {
      // Deduct tokens
      const newUsedTokens = usedTokens + tokensNeeded;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      // Step 1: AI Vision & Prompt Generation (gemini-2.5-flash)
      // Extract base64 data from data URL
      let base64Data = originalImage;
      if (originalImage.startsWith('data:')) {
        base64Data = originalImage.split(',')[1];
      }
      
      // Send image to gemini-2.5-flash for analysis
      const visionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              {
                text: "Analyze the main subject of this image. Generate a concise, descriptive prompt for an AI image editor to replace the background with a new, realistic, and contextually appropriate one that complements the main subject. The new background should enhance but not distract from the main subject. Return only the background description prompt without any additional text."
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data
                }
              }
            ]
          }]
        }),
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error('Vision API Error Response:', errorText); // Debug log
        throw new Error(`Vision API request failed with status ${visionResponse.status}: ${errorText}`);
      }

      const visionData = await visionResponse.json();
      console.log('Vision API Response:', visionData); // Debug log
      
      const generatedPrompt = visionData.candidates?.[0]?.content?.parts?.[0]?.text || 
        "a beautiful landscape";

      setAiGeneratedPrompt(generatedPrompt);
      setPrompt(generatedPrompt);
      
      // Step 2: AI Image Editing (gemini-2.5-flash-image)
      // Send image and prompt to gemini-2.5-flash-image model for editing
      const editPayload = {
        contents: [{
          role: "user",
          parts: [
            {
              text: `Modify ONLY the background of this image to match: ${generatedPrompt}. CRITICAL: Keep the main subject (especially any person) completely unchanged, preserving all details including facial features, hair, clothing, and jewelry. Do not add, remove, or modify any part of the main subject. Only change the background. Also, ensure the output image has an aspect ratio of ${aspectRatio}.`
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data
              }
            }
          ]
        }]
      };
      
      console.log('Edit API Request Payload:', editPayload); // Debug log
      
      // Use the correct model name
      const editResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPayload),
      });

      if (!editResponse.ok) {
        const errorText = await editResponse.text();
        console.error('Edit API Error Response:', errorText); // Debug log
        throw new Error(`Edit API request failed with status ${editResponse.status}: ${errorText}`);
      }

      const editData = await editResponse.json();
      console.log('Edit API Response:', editData); // Debug log
      
      // Extract the edited image from the response
      if (editData.candidates && editData.candidates[0] && editData.candidates[0].content) {
        const parts = editData.candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            setEditedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            return;
          }
        }
      }
      
      // Fallback if no image in response
      throw new Error('No edited image in API response. Response structure: ' + JSON.stringify(editData));
    } catch (err) {
      // Refund tokens on error
      const newUsedTokens = usedTokens - 100;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      setError(`Failed to auto-enhance background: ${err.message}`);
      console.error('Auto-enhance error:', err);
      
      // Fallback to simulated effect
      try {
        const processedImage = await applyVisualEffect(originalImage, 'sunset');
        setEditedImage(processedImage);
      } catch (fallbackErr) {
        setError('Failed to process image even with fallback method');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual edit with custom prompt using Gemini model
  const manualEdit = async () => {
    if (!originalImage || !prompt.trim()) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    // Check token availability (manual edit uses 50 tokens)
    const tokensNeeded = 50;
    if (tokensNeeded > availableTokens) {
      setError(`Insufficient tokens. You need ${tokensNeeded} tokens but only have ${availableTokens} available.`);
      return;
    }

    setLoading(true);
    setError('');
    setEditMode('manual');
    
    try {
      // Deduct tokens
      const newUsedTokens = usedTokens + tokensNeeded;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      // Extract base64 data from data URL
      let base64Data = originalImage;
      if (originalImage.startsWith('data:')) {
        base64Data = originalImage.split(',')[1];
      }
      
      // Send image and prompt to gemini-2.0-flash-exp-image-generation for editing
      const editPayload = {
        contents: [{
          role: "user",
          parts: [
            {
              text: `Modify the image according to this prompt: ${prompt}. CRITICAL: Keep the main subject (especially if it's a person) completely unchanged, in focus, and with all details preserved including facial features, hair, clothing, and jewelry. Do not add, remove, or modify any part of the main subject. Only change the background or other elements as specified in the prompt. If the person is wearing jewelry (like gold jewelry), it must remain exactly the same. Also, ensure the output image has an aspect ratio of ${aspectRatio}.`
            },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data
              }
            }
          ]
        }]
      };
      
      console.log('Manual Edit API Request Payload:', editPayload); // Debug log
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Manual Edit API Error Response:', errorText); // Debug log
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Manual Edit API Response:', data); // Debug log
      
      // Extract the edited image from the response
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            setEditedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            return;
          }
        }
      }
      
      // Fallback if no image in response
      throw new Error('No edited image in API response. Response structure: ' + JSON.stringify(data));
    } catch (err) {
      // Refund tokens on error
      const newUsedTokens = usedTokens - tokensNeeded;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      setError(`Failed to edit image: ${err.message}`);
      console.error('Manual edit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply visual effect to simulate image editing (fallback)
  const applyVisualEffect = (imageSrc, effectType) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Apply different effects based on the effect type
        switch (effectType) {
          case 'vintage':
            // Apply sepia effect
            ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'cyberpunk':
            // Apply blue/purple tint
            ctx.fillStyle = 'rgba(128, 0, 128, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'sunset':
            // Apply orange/yellow tint
            ctx.fillStyle = 'rgba(255, 140, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'forest':
            // Apply green tint
            ctx.fillStyle = 'rgba(34, 139, 34, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'space':
            // Apply dark blue tint
            ctx.fillStyle = 'rgba(0, 0, 139, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'bokeh':
            // Apply light blur effect
            ctx.filter = 'blur(2px)';
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            break;
          case 'beach':
            // Apply light blue tint
            ctx.fillStyle = 'rgba(173, 216, 230, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          case 'storm':
            // Apply dark gray tint
            ctx.fillStyle = 'rgba(105, 105, 105, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            break;
          default:
            // Apply a subtle filter for manual edits
            ctx.fillStyle = 'rgba(100, 100, 200, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Return the data URL of the modified image
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageSrc;
    });
  };

  // Download edited image
  const downloadImage = () => {
    if (!editedImage) return;
    
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = 'edited-image.png';
    link.click();
  };

  // Calculate token usage percentage for progress bar
  const tokenUsagePercentage = totalTokens > 0 ? (usedTokens / totalTokens) * 100 : 0;

  return (
    <div className="edit-screen">
      <header className="edit-header">
        <h1>✨ AI Image Editor</h1>
        <p>Transform your photos with Gemini AI</p>
        <button className="theme-toggle" onClick={toggleTheme}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>

      <main className="edit-main">
        {!showEditPanel ? (
          <div className="upload-section">
            <div className="upload-container" onClick={triggerFileInput}>
              <div className="upload-icon">📸</div>
              <p>Click to upload an image</p>
              <p className="upload-hint">Supports JPG, PNG, or WEBP formats</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept=".jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <div className="edit-section">
            <div className="edit-header-bar">
              <h2>🎨 Edit Image</h2>
              <button className="generator-button" onClick={onNavigateToGenerator}>
                🖼️ Image Generator
              </button>
            </div>

            {/* Token information with progress bar */}
            <div className="token-info-container">
              <div className="token-header">
                <h3>💳 Token Usage</h3>
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
                  <span className="used-tokens">💳 {usedTokens} used</span>
                  <span className="available-tokens">✅ {availableTokens} available</span>
                  <span className="total-tokens">📊 {totalTokens} total</span>
                </div>
              </div>
              
              <div className="token-details">
                <div className="token-item">
                  <span className="token-label">✨ Auto-Enhance</span>
                  <span className="token-value">100 tokens</span>
                </div>
                <div className="token-item">
                  <span className="token-label">✏️ Manual Edit</span>
                  <span className="token-value">50 tokens</span>
                </div>
              </div>
            </div>

            <div className="image-comparison">
              <div className="image-panel">
                <h3>Original</h3>
                <div className="image-container">
                  <div className="image-display-container">
                    <img src={originalImage} alt="Original" className="preview-image" data-aspect-ratio={aspectRatio} />
                  </div>
                </div>
              </div>

              <div className="image-panel">
                <h3>Edited</h3>
                <div className="image-container">
                  {editedImage ? (
                    <div className="edited-image-container">
                      <div className="image-display-container">
                        <img src={editedImage} alt="Edited" className="preview-image" data-aspect-ratio={aspectRatio} />
                      </div>
                      <div className="edit-overlay">
                        <div className="edit-overlay-content">
                          <div className="prompt-display">
                            <p><strong>{editMode === 'auto' ? '🤖 AI-Generated Prompt:' : '✏️ Applied Prompt:'}</strong></p>
                            <p>{prompt}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="placeholder-image">
                      {loading ? (
                        <div className="loading-state">
                          <div className="spinner"></div>
                          <p>{editMode === 'auto' ? '🤖 AI is analyzing and enhancing your image...' : '🎨 Processing your image...'}</p>
                          <p className="processing-prompt">{prompt && `Applying: ${prompt}`}</p>
                        </div>
                      ) : (
                        <div className="placeholder-image">
                          <div className="placeholder-icon">🖼️</div>
                          <p>Your edited image will appear here</p>
                          <p className="upload-hint">Click "Apply Edit" to process your image</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="edit-controls">
              {/* Aspect Ratio Selector */}
              <div className="aspect-ratio-selector">
                <h3>📐 Aspect Ratio</h3>
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

              <div className="prompt-section">
                <div className="prompt-header">
                  <h3>💬 Edit Prompt</h3>
                  <div className="prompt-header-actions">
                    <button className="swap-image-button" onClick={triggerFileInput}>
                      🔄 Swap Image
                    </button>
                    <button className="theme-toggle" onClick={toggleTheme}>
                      {darkMode ? '☀️ Light' : '🌙 Dark'}
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept=".jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="prompt-input-container">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the changes you want to make to your image..."
                    className="prompt-textarea"
                    disabled={loading}
                  />
                  {aiGeneratedPrompt && (
                    <div className="ai-prompt-note">
                      <small>✨ AI-Generated Prompt: {aiGeneratedPrompt}</small>
                    </div>
                  )}
                  <div className="ai-prompt-note" style={{ marginTop: '10px' }}>
                    <small>ℹ️ Auto-Enhance analyzes your image and changes only the background while preserving the main subject.</small>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="auto-enhance-button" 
                  onClick={autoEnhanceBackground}
                  disabled={loading}
                >
                  🤖 {loading && editMode === 'auto' ? 'Processing...' : 'Auto-Enhance Background'} (100 tokens)
                </button>
                <button 
                  className="manual-edit-button" 
                  onClick={manualEdit}
                  disabled={loading}
                >
                  {loading && editMode === 'manual' ? 'Processing...' : '✏️ Apply Edit'} (50 tokens)
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              {editedImage && (
                <div className="download-section">
                  <button className="download-button" onClick={downloadImage}>
                    💾 Download Edited Image
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EditScreen;