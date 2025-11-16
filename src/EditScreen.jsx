import { useState, useRef, useEffect } from 'react';
import './EditScreen.css';

function EditScreen({ onNavigateToGenerator }) {
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
  const fileInputRef = useRef(null);

  // Gemini API configuration
  const GEMINI_API_KEY = 'AIzaSyB9slH0K_FDyTZbkshXkv_uTPcMalzz7Jc';

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

  // Save tokens to localStorage
  useEffect(() => {
    localStorage.setItem('usedTokens', usedTokens.toString());
    localStorage.setItem('totalTokens', totalTokens.toString());
  }, [usedTokens, totalTokens]);

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
      const base64Data = originalImage.split(',')[1];
      
      // Send image to gemini-2.5-flash for analysis
      const visionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze this image's main subject and generate a descriptive prompt to replace its background with something realistic and contextually appropriate. Return only the prompt without any additional text."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }]
        }),
      });

      if (!visionResponse.ok) {
        throw new Error(`Vision API request failed with status ${visionResponse.status}`);
      }

      const visionData = await visionResponse.json();
      const generatedPrompt = visionData.candidates?.[0]?.content?.parts?.[0]?.text || 
        "Enhance the background with a beautiful landscape";

      setAiGeneratedPrompt(generatedPrompt);
      setPrompt(generatedPrompt);
      
      // Step 2: AI Image Editing (gemini-2.5-flash-image)
      // Send image and prompt to gemini-2.5-flash-image for editing
      const editResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: generatedPrompt
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }]
        }),
      });

      if (!editResponse.ok) {
        throw new Error(`Edit API request failed with status ${editResponse.status}`);
      }

      const editData = await editResponse.json();
      
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
      throw new Error('No edited image in API response');
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

  // Manual edit with custom prompt using Gemini Pro Image
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
      const base64Data = originalImage.split(',')[1];
      
      // Send image and prompt to gemini-1.5-pro for editing
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
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
      throw new Error('No edited image in API response');
    } catch (err) {
      // Refund tokens on error
      const newUsedTokens = usedTokens - 50;
      setUsedTokens(newUsedTokens);
      setAvailableTokens(totalTokens - newUsedTokens);
      
      setError(`Failed to edit image: ${err.message}`);
      console.error('Edit error:', err);
      
      // Fallback to simulated effect
      try {
        const processedImage = await applyVisualEffect(originalImage, 'manual');
        setEditedImage(processedImage);
      } catch (fallbackErr) {
        setError('Failed to process image even with fallback method');
      }
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
        <h1>AI Image Editor</h1>
        <p>Transform your photos with Gemini AI</p>
      </header>

      <main className="edit-main">
        {!showEditPanel ? (
          <div className="upload-section">
            <div className="upload-container" onClick={triggerFileInput}>
              <div className="upload-icon">📷</div>
              <p>Click to upload an image</p>
              <p className="upload-hint">(JPG, PNG, or WEBP)</p>
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
              <h2>Edit Image</h2>
              <button className="generator-button" onClick={onNavigateToGenerator}>
                🎨 Image Generator
              </button>
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
                  <span className="token-label">Auto-Enhance:</span>
                  <span className="token-value">100 tokens</span>
                </div>
                <div className="token-item">
                  <span className="token-label">Manual Edit:</span>
                  <span className="token-value">50 tokens</span>
                </div>
              </div>
            </div>

            <div className="image-comparison">
              <div className="image-panel">
                <h3>Original</h3>
                <div className="image-container">
                  <img src={originalImage} alt="Original" className="preview-image" />
                </div>
              </div>

              <div className="image-panel">
                <h3>Edited</h3>
                <div className="image-container">
                  {editedImage ? (
                    <div className="edited-image-container">
                      <img src={editedImage} alt="Edited" className="preview-image" />
                      <div className="edit-overlay">
                        <div className="prompt-display">
                          <p><strong>{editMode === 'auto' ? 'AI-Generated Prompt:' : 'Applied Prompt:'}</strong> {prompt}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="placeholder-image">
                      {loading ? (
                        <div className="loading-state">
                          <div className="spinner"></div>
                          <p>{editMode === 'auto' ? 'AI is analyzing and enhancing your image...' : 'Processing your image...'}</p>
                          <p className="processing-prompt">{prompt && `Applying: ${prompt}`}</p>
                        </div>
                      ) : (
                        <p>Your edited image will appear here</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="edit-controls">
              <div className="prompt-section">
                <div className="prompt-header">
                  <h3>Edit Prompt</h3>
                  <button className="swap-image-button" onClick={triggerFileInput}>
                    🖼️ Swap Image
                  </button>
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
                    placeholder="Enter your edit instructions or click 'Auto-Enhance Background'"
                    className="prompt-textarea"
                    disabled={loading}
                  />
                  {aiGeneratedPrompt && (
                    <div className="ai-prompt-note">
                      <small>✨ AI-Generated Prompt: {aiGeneratedPrompt}</small>
                    </div>
                  )}
                </div>
              </div>

              <div className="action-buttons">
                <button 
                  className="auto-enhance-button" 
                  onClick={autoEnhanceBackground}
                  disabled={loading}
                >
                  ✨ Auto-Enhance Background (100 tokens)
                </button>
                <button 
                  className="manual-edit-button" 
                  onClick={manualEdit}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Apply Edit (50 tokens)'}
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              {editedImage && (
                <div className="download-section">
                  <button className="download-button" onClick={downloadImage}>
                    📥 Download Edited Image
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