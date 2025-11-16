import streamlit as st
import os
from pathlib import Path

st.title("AI Image Generator - Deployment Instructions")

st.info("""
🚨 IMPORTANT: This application was built with React/Vite, not Streamlit.
To deploy it, you need to upload the contents of the 'dist' folder.
""")

# Check if build exists
st.subheader("Deployment Steps")
dist_path = Path("dist")

if dist_path.exists():
    st.success("✅ Build directory found")
    
    # Count files
    files = list(dist_path.rglob("*"))
    file_count = len([f for f in files if f.is_file()])
    
    st.write(f"Found {file_count} files ready for deployment")
    
    # Show key files
    key_files = ["index.html", "assets"]
    for item in key_files:
        item_path = dist_path / item
        if item_path.exists():
            st.write(f"✅ {item}")
        else:
            st.write(f"❌ {item}")
    
    st.markdown("---")
    st.subheader("How to Deploy")
    st.markdown("""
    1. **Upload all files from the `dist` folder** to your hosting provider
    
    Popular deployment options:
    - **Vercel**: Connect your GitHub repo
    - **Netlify**: Drag and drop the `dist` folder
    - **GitHub Pages**: Push the `dist` folder to a gh-pages branch
    - **Firebase**: Use `firebase deploy`
    - **Any static hosting**: Upload all files from `dist`
    
    2. **No server-side code is needed** - this is a client-side React app
    """)
    
else:
    st.error("❌ Build directory not found")
    st.markdown("""
    Please build the React app first:
    ```bash
    npm run build
    ```
    This will create the `dist` folder with all files needed for deployment.
    """)

st.markdown("---")
st.caption("This Streamlit app only provides deployment instructions for the React/Vite application.")