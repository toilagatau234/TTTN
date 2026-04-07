import requests
import json

url = "http://localhost:8000/api/hydrangea/generate-image"
payload = {
    "layout": "round",
    "main_color": "pink",
    "sub_color": "white"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data['success']}")
        print(f"Layout: {data['layout']}")
        # Don't print the whole base64 string, just the first 50 chars
        print(f"Image Base64 (prefix): {data['image_base64'][:50]}...")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
