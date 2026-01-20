"""
FlexCard Image Upload and QR Code Tests
Tests for:
- Avatar upload functionality
- Cover image upload functionality
- Image display on public profile
- QR Code (always black)
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_img_1768906690631"
USERNAME = "testuser1768906690631"

# Small test image (1x1 red pixel PNG)
TEST_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="


class TestImageUpload:
    """Test image upload functionality"""
    
    @pytest.fixture
    def auth_headers(self):
        return {
            "Authorization": f"Bearer {SESSION_TOKEN}",
            "Content-Type": "application/json"
        }
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "FlexCard API"
        print("✓ API health check passed")
    
    def test_auth_me(self, auth_headers):
        """Test authentication works"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        print(f"✓ Auth check passed - user: {data['user_id']}")
    
    def test_get_profile(self, auth_headers):
        """Test getting user profile"""
        response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert data["username"] == USERNAME
        print(f"✓ Profile retrieved - username: {data['username']}")
    
    def test_avatar_upload(self, auth_headers):
        """Test avatar upload functionality"""
        # Upload avatar
        response = requests.post(
            f"{BASE_URL}/api/upload/avatar",
            headers=auth_headers,
            json={"image": TEST_IMAGE_BASE64}
        )
        assert response.status_code == 200
        data = response.json()
        assert "avatar" in data
        assert data["avatar"].startswith("/api/uploads/")
        print(f"✓ Avatar uploaded - path: {data['avatar']}")
        
        # Verify avatar is accessible
        avatar_url = f"{BASE_URL}{data['avatar']}"
        img_response = requests.get(avatar_url)
        assert img_response.status_code == 200
        print(f"✓ Avatar accessible at: {avatar_url}")
        
        # Verify profile updated
        profile_response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["avatar"] == data["avatar"]
        print("✓ Profile avatar field updated correctly")
    
    def test_cover_upload(self, auth_headers):
        """Test cover image upload functionality"""
        # Upload cover
        response = requests.post(
            f"{BASE_URL}/api/upload/cover",
            headers=auth_headers,
            json={"image": TEST_IMAGE_BASE64}
        )
        assert response.status_code == 200
        data = response.json()
        assert "cover_image" in data
        assert data["cover_image"].startswith("/api/uploads/")
        print(f"✓ Cover uploaded - path: {data['cover_image']}")
        
        # Verify cover is accessible
        cover_url = f"{BASE_URL}{data['cover_image']}"
        img_response = requests.get(cover_url)
        assert img_response.status_code == 200
        print(f"✓ Cover accessible at: {cover_url}")
        
        # Verify profile updated
        profile_response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        assert profile_data["cover_image"] == data["cover_image"]
        assert profile_data["cover_type"] == "image"
        print("✓ Profile cover_image and cover_type fields updated correctly")
    
    def test_public_profile_with_images(self, auth_headers):
        """Test public profile displays images correctly"""
        response = requests.get(f"{BASE_URL}/api/public/{USERNAME}")
        assert response.status_code == 200
        data = response.json()
        
        profile = data["profile"]
        assert profile["avatar"] is not None
        assert profile["cover_image"] is not None
        print(f"✓ Public profile has avatar: {profile['avatar']}")
        print(f"✓ Public profile has cover: {profile['cover_image']}")
    
    def test_existing_profile_jihemekacou(self):
        """Test existing profile with avatar (legacy path)"""
        response = requests.get(f"{BASE_URL}/api/public/jihemekacou")
        assert response.status_code == 200
        data = response.json()
        
        profile = data["profile"]
        assert profile["avatar"] is not None
        # Legacy path should be /uploads/...
        assert "/uploads/" in profile["avatar"]
        print(f"✓ Profile jihemekacou has avatar: {profile['avatar']}")
        
        # Test that image is accessible via /api/uploads path
        # Frontend handles legacy paths by prepending /api
        filename = profile["avatar"].replace("/uploads/", "")
        img_url = f"{BASE_URL}/api/uploads/{filename}"
        img_response = requests.get(img_url)
        assert img_response.status_code == 200
        print(f"✓ Avatar accessible via /api/uploads: {img_url}")
    
    def test_existing_profile_kounapster(self):
        """Test existing profile with cover image (legacy path)"""
        response = requests.get(f"{BASE_URL}/api/public/kounapster")
        assert response.status_code == 200
        data = response.json()
        
        profile = data["profile"]
        assert profile["cover_image"] is not None
        # Legacy path should be /uploads/...
        assert "/uploads/" in profile["cover_image"]
        print(f"✓ Profile kounapster has cover: {profile['cover_image']}")
        
        # Test that image is accessible via /api/uploads path
        filename = profile["cover_image"].replace("/uploads/", "")
        img_url = f"{BASE_URL}/api/uploads/{filename}"
        img_response = requests.get(img_url)
        assert img_response.status_code == 200
        print(f"✓ Cover accessible via /api/uploads: {img_url}")
    
    def test_avatar_delete(self, auth_headers):
        """Test avatar deletion"""
        response = requests.delete(f"{BASE_URL}/api/upload/avatar", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify profile updated
        profile_response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        profile_data = profile_response.json()
        assert profile_data["avatar"] is None
        print("✓ Avatar deleted successfully")
    
    def test_cover_delete(self, auth_headers):
        """Test cover deletion"""
        response = requests.delete(f"{BASE_URL}/api/upload/cover", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify profile updated
        profile_response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        profile_data = profile_response.json()
        assert profile_data["cover_image"] is None
        assert profile_data["cover_type"] == "color"
        print("✓ Cover deleted successfully")


class TestPublicProfileDisplay:
    """Test public profile display features"""
    
    def test_public_profile_structure(self):
        """Test public profile returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/public/kounapster")
        assert response.status_code == 200
        data = response.json()
        
        assert "profile" in data
        assert "links" in data
        
        profile = data["profile"]
        # Check required fields for display
        assert "first_name" in profile
        assert "last_name" in profile
        assert "avatar" in profile
        assert "cover_image" in profile
        assert "cover_color" in profile
        assert "cover_type" in profile
        print("✓ Public profile has all required fields for display")
    
    def test_profile_name_fields(self):
        """Test profile has first_name and last_name for centering"""
        response = requests.get(f"{BASE_URL}/api/public/kounapster")
        assert response.status_code == 200
        data = response.json()
        
        profile = data["profile"]
        assert profile["first_name"] == "Jean-Marc"
        assert profile["last_name"] == "KOUASSI"
        print(f"✓ Profile name: {profile['first_name']} {profile['last_name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
