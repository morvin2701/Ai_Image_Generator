# AI Image Generator

An AI-powered image generation application using Google's Gemini API.

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_GEMINI_API_KEY`: Your Gemini API key (required)

To obtain a Gemini API key:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an account or sign in
3. Navigate to API keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the production version
- `npm run preview`: Preview the production build

## Features

- Generate AI images using text prompts
- Multiple image count options (1-4 images)
- Various aspect ratios (1:1, 16:9, 9:16, 4:3, 3:4)
- Token usage tracking
- Recent images gallery
- Dark/light mode toggle