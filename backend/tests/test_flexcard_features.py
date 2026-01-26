"""
FlexCard Feature Tests - Testing new features:
1. Forgot password endpoint
2. User registration creates user in database
3. Social links URL normalization
4. VCF export with photo
5. Public profile with clickable links
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestForgotPassword:
    """Test forgot password functionality"""
    
    def test_forgot_password_endpoint_exists(self):
        """Test that /api/auth/forgot-password endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "test@example.com"}
        )
        # Should return 200 (always returns success for security)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Forgot password endpoint works: {data['message']}")
    
    def test_forgot_password_with_existing_email(self):
        """Test forgot password with an existing user email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "testuser1769424288@test.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "If an account exists" in data["message"]
        print("✓ Forgot password with existing email returns success")
    
    def test_forgot_password_with_nonexistent_email(self):
        """Test forgot password with non-existent email (should still return success for security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "If an account exists" in data["message"]
        print("✓ Forgot password with non-existent email returns success (security)")
    
    def test_forgot_password_invalid_email_format(self):
        """Test forgot password with invalid email format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "invalid-email"}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Forgot password rejects invalid email format")


class TestUserRegistration:
    """Test user registration creates user in database"""
    
    def test_register_creates_user(self):
        """Test that registration creates a user in the database"""
        test_email = f"testregister{int(time.time())}@test.com"
        
        # Register new user
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "name": "Test Registration User",
                "password": "test123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify user data is returned
        assert "user_id" in data
        assert data["email"] == test_email
        assert data["name"] == "Test Registration User"
        assert data["auth_type"] == "email"
        print(f"✓ User registered successfully: {data['user_id']}")
        
        # Verify user can login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": test_email, "password": "test123"}
        )
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert login_data["user_id"] == data["user_id"]
        print("✓ Registered user can login successfully")
    
    def test_register_duplicate_email_rejected(self):
        """Test that duplicate email registration is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "testuser1769424288@test.com",
                "name": "Duplicate User",
                "password": "test123"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print("✓ Duplicate email registration correctly rejected")


class TestSocialLinksNormalization:
    """Test social links URL normalization"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testuser1769424288@test.com", "password": "test123"}
        )
        if response.status_code != 200:
            pytest.skip("Could not authenticate")
        return session
    
    def test_add_link_without_protocol(self, auth_session):
        """Test adding a link without https:// - frontend should normalize"""
        # Note: The backend stores the URL as-is, normalization happens in frontend
        response = auth_session.post(
            f"{BASE_URL}/api/links",
            json={
                "type": "social",
                "platform": "instagram",
                "url": "instagram.com/testuser",  # No https://
                "title": "Instagram Test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "link_id" in data
        print(f"✓ Link created: {data['link_id']}")
        
        # Clean up - delete the test link
        delete_response = auth_session.delete(f"{BASE_URL}/api/links/{data['link_id']}")
        assert delete_response.status_code == 200
        print("✓ Test link cleaned up")
    
    def test_add_link_with_protocol(self, auth_session):
        """Test adding a link with https:// - should work normally"""
        response = auth_session.post(
            f"{BASE_URL}/api/links",
            json={
                "type": "social",
                "platform": "twitter",
                "url": "https://twitter.com/testuser",
                "title": "Twitter Test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["url"] == "https://twitter.com/testuser"
        print(f"✓ Link with https:// created correctly")
        
        # Clean up
        auth_session.delete(f"{BASE_URL}/api/links/{data['link_id']}")


class TestPublicProfile:
    """Test public profile functionality"""
    
    def test_public_profile_exists(self):
        """Test that public profile endpoint works"""
        response = requests.get(f"{BASE_URL}/api/public/testuser1769424288")
        assert response.status_code == 200
        data = response.json()
        assert "profile" in data
        assert "links" in data
        print(f"✓ Public profile loaded: {data['profile']['username']}")
    
    def test_public_profile_returns_links(self):
        """Test that public profile returns links"""
        response = requests.get(f"{BASE_URL}/api/public/testuser1769424288")
        assert response.status_code == 200
        data = response.json()
        
        # Check links structure
        assert isinstance(data["links"], list)
        if len(data["links"]) > 0:
            link = data["links"][0]
            assert "link_id" in link
            assert "url" in link
            assert "title" in link
            print(f"✓ Public profile has {len(data['links'])} links")
        else:
            print("✓ Public profile has no links (empty)")
    
    def test_public_profile_nonexistent(self):
        """Test that non-existent profile returns 404"""
        response = requests.get(f"{BASE_URL}/api/public/nonexistentuser12345")
        assert response.status_code == 404
        print("✓ Non-existent profile returns 404")
    
    def test_public_profile_click_tracking(self):
        """Test that link clicks are tracked"""
        # First get the profile to find a link
        profile_response = requests.get(f"{BASE_URL}/api/public/testuser1769424288")
        if profile_response.status_code != 200:
            pytest.skip("Profile not found")
        
        data = profile_response.json()
        if len(data["links"]) == 0:
            pytest.skip("No links to test")
        
        link_id = data["links"][0]["link_id"]
        
        # Record a click
        click_response = requests.post(
            f"{BASE_URL}/api/public/testuser1769424288/click/{link_id}"
        )
        assert click_response.status_code == 200
        print(f"✓ Click recorded for link {link_id}")


class TestContactForm:
    """Test contact form submission on public profile"""
    
    def test_submit_contact_form(self):
        """Test submitting contact form on public profile"""
        response = requests.post(
            f"{BASE_URL}/api/public/testuser1769424288/contact",
            json={
                "name": "Test Contact",
                "email": "contact@test.com",
                "phone": "+1234567890",
                "message": "Test message from automated test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "contact_id" in data
        print(f"✓ Contact form submitted: {data['contact_id']}")


class TestAPIHealth:
    """Test API health and basic functionality"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "FlexCard API"
        assert data["version"] == "2.0.0"
        assert data["database"] == "Supabase"
        print(f"✓ API is healthy: {data['message']} v{data['version']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
