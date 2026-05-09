import os
import urllib.request
import urllib.parse
import time

letters = [
    "अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "अं", "अः",
    "क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ", "ड", "ढ", "ण",
    "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म",
    "य", "र", "ल", "व", "श", "ष", "स", "ह", "ळ", "क्ष", "ज्ञ"
]

os.makedirs('audio', exist_ok=True)

for i, letter in enumerate(letters):
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=mr&client=tw-ob&q={urllib.parse.quote(letter)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(f"audio/{i}.mp3", 'wb') as f:
                f.write(response.read())
        print(f"Downloaded audio/{i}.mp3 ({letter})")
        time.sleep(0.5) # Be nice to Google
    except Exception as e:
        print(f"Failed {letter}: {e}")

