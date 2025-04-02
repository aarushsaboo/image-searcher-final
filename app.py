from flask import Flask, render_template, request, jsonify, send_file
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import random
import requests
from PIL import Image
from io import BytesIO
import os
from datetime import datetime

app = Flask(__name__)

# Create a directory to save images if it doesn't exist
if not os.path.exists("downloaded_images"):
    os.makedirs("downloaded_images")

def get_webdriver_options():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    return chrome_options

def search_pixabay(query):
    """Search Pixabay for images related to the query"""
    formatted_query = query.replace(" ", "+")
    url = f"https://pixabay.com/images/search/{formatted_query}/"
    
    chrome_options = get_webdriver_options()
    
    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        driver.get(url)
        time.sleep(5)
        
        selectors = [
            "div.container--wYO8e div.images--0AI\\+S a img",
            "div.container--wYO8e div.results--mB75j div a img",
            "a[href*='/images/'] img",
            "img[src*='pixabay.com']"
        ]
        
        image_urls = []
        
        for selector in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                
                if elements:
                    for img in elements:
                        src = img.get_attribute("src")
                        if src and src.startswith("https://") and "pixabay.com" in src:
                            if src not in image_urls:
                                image_urls.append(src)
                    
                    if image_urls:
                        break
            except Exception:
                pass
        
        return image_urls[:20]
    
    except Exception as e:
        print(f"Error finding images: {e}")
        return []
    
    finally:
        if 'driver' in locals():
            driver.quit()

def download_image(url):
    """Download an image from a URL and return a PIL Image object"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://pixabay.com/"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content))
        return img
    except Exception as e:
        print(f"Couldn't download image: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/features')
def features():
    return render_template('features.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.form.get('query')
    if not query:
        return jsonify({'error': 'No search query provided'}), 400
    
    image_urls = search_pixabay(query)
    return jsonify({'images': image_urls})

@app.route('/download', methods=['POST'])
def download():
    url = request.form.get('url')
    query = request.form.get('query')
    
    if not all([url, query]):
        return jsonify({'error': 'Missing parameters'}), 400
    
    try:
        img = download_image(url)
        if img:
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Create a timestamp for the filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{query.replace(' ', '_')}_{timestamp}.jpg"
            
            # Save the image to a temporary BytesIO object
            img_io = BytesIO()
            img.save(img_io, 'JPEG')
            img_io.seek(0)
            
            # Send the file to the user's browser
            return send_file(
                img_io,
                mimetype='image/jpeg',
                as_attachment=True,
                download_name=filename
            )
        return jsonify({'error': 'Failed to download image'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 