# AI Image Generator

An AI-powered image generation application using Google's Gemini API.

## Setup Instructions

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Create a `.env` file in the root directory with your API key:
   
   ```
   VITE_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Log in with default credentials (username: `abc`, password: `123`)
2. Enter your Gemini API key on the login screen if not set in `.env`
3. Describe the image you want to generate
4. Select the number of images and aspect ratio
5. Click "Generate" to create your images

## Troubleshooting

If you encounter an "API key not valid" error:
1. Verify your API key is correct and active in Google AI Studio
2. Make sure the API key is properly set in your `.env` file
3. Restart the development server after updating the `.env` file