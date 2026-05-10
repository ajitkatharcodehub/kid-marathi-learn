import os
import urllib.request
import urllib.parse
import time

# Dictionary of letters and their associated words for audio download
emoji_map = {
    "अ": "अननस", "आ": "आंबा", "इ": "इमारत", "ई": "ईडलिंबू", "उ": "उंदीर", 
    "ऊ": "ऊस", "ए": "एडका", "ऐ": "ऐरावत", "ओ": "ओठ", "औ": "औषध", 
    "अं": "अंगूर", "अः": "अः", "क": "कमळ", "ख": "खिडकी", "ग": "गाय", 
    "घ": "घर", "च": "चमचा", "छ": "छत्री", "ज": "जहाज", "झ": "झाड", 
    "ट": "टरबूज", "ठ": "ठसा", "ड": "डमरू", "ढ": "ढग", "ण": "बाण", 
    "त": "तराजू", "थ": "थेंब", "द": "दरवाजा", "ध": "धनुष्य", "न": "नळ", 
    "प": "पतंग", "फ": "फळ", "ब": "बदक", "भ": "भोपळा", "म": "मासा", 
    "य": "यज्ञ", "र": "रस्ता", "ल": "लसूण", "व": "वड", "श": "शहामृग", 
    "ष": "षटकोन", "स": "ससा", "ह": "हत्ती", "ळ": "बाळ", "क्ष": "क्ष-किरण", 
    "ज्ञ": "ज्ञान"
}

letters = [
    "अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "अं", "अः",
    "क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ", "ड", "ढ", "ण",
    "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म",
    "य", "र", "ल", "व", "श", "ष", "स", "ह", "ळ", "क्ष", "ज्ञ"
]

os.makedirs('audio', exist_ok=True)

for i, letter in enumerate(letters):
    word = emoji_map.get(letter, letter)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=mr&client=tw-ob&q={urllib.parse.quote(word)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(f"audio/word_{i}.mp3", 'wb') as f:
                f.write(response.read())
        print(f"Downloaded audio/word_{i}.mp3 ({word})")
        time.sleep(0.3) # Be nice to Google
    except Exception as e:
        print(f"Failed {word}: {e}")
