import requests
import json

def test_admin_login():
    url = "http://localhost:5001/admin/login"
    
    # Test data - exact match from your database
    data = {
        "email": "admin@kisanlink.com",
        "password": "admin123"
    }
    
    print("Testing Admin Login...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(
            url,
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Login Successful!")
            print(f"Message: {result.get('message')}")
            print(f"User Type: {result.get('user_type')}")
            print(f"User Name: {result.get('user_name')}")
            
            # Check if session cookie is set
            if 'Set-Cookie' in response.headers:
                print(f"Session Cookie: {response.headers['Set-Cookie']}")
        else:
            print(f"\n❌ Login Failed")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('error')}")
                print(f"Details: {error_data.get('details', 'No details')}")
            except:
                print(f"Raw error: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure Flask is running!")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_admin_login()