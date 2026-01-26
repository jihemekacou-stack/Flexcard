"""
Test suite for FlexCard Supabase Auth integration
Tests: supabase-sync endpoint, auth protection, public profile access
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSupabaseAuthSync:
    """Tests for /api/auth/supabase-sync endpoint"""
    
    def test_supabase_sync_creates_new_user(self):
        """Test that supabase-sync creates a new user"""
        timestamp = int(time.time())
        response = requests.post(f"{BASE_URL}/api/auth/supabase-sync", json={
            "supabase_user_id": f"supabase_test_{timestamp}",
            "email": f"supabase_test_{timestamp}@example.com",
            "name": "Supabase Test User"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == f"supabase_test_{timestamp}@example.com"
        assert data["name"] == "Supabase Test User"
        assert data["auth_type"] == "supabase"
        assert data["supabase_user_id"] == f"supabase_test_{timestamp}"
    
    def test_supabase_sync_updates_existing_user(self):
        """Test that supabase-sync updates existing user by supabase_user_id"""
        timestamp = int(time.time())
        supabase_id = f"supabase_update_{timestamp}"
        
        # Create user first
        response1 = requests.post(f"{BASE_URL}/api/auth/supabase-sync", json={
            "supabase_user_id": supabase_id,
            "email": f"update_test_{timestamp}@example.com",
            "name": "Original Name"
        })
        assert response1.status_code == 200
        
        # Update user with same supabase_user_id
        response2 = requests.post(f"{BASE_URL}/api/auth/supabase-sync", json={
            "supabase_user_id": supabase_id,
            "email": f"update_test_{timestamp}@example.com",
            "name": "Updated Name"
        })
        assert response2.status_code == 200
        data = response2.json()
        assert data["name"] == "Updated Name"
        assert data["supabase_user_id"] == supabase_id
    
    def test_supabase_sync_sets_session_cookie(self):
        """Test that supabase-sync sets a session cookie"""
        timestamp = int(time.time())
        response = requests.post(f"{BASE_URL}/api/auth/supabase-sync", json={
            "supabase_user_id": f"cookie_test_{timestamp}",
            "email": f"cookie_test_{timestamp}@example.com",
            "name": "Cookie Test User"
        })
        
        assert response.status_code == 200
        # Check for session_token cookie in response
        assert "session_token" in response.cookies or "set-cookie" in str(response.headers).lower()
    
    def test_supabase_sync_missing_fields(self):
        """Test that supabase-sync rejects requests with missing fields"""
        response = requests.post(f"{BASE_URL}/api/auth/supabase-sync", json={
            "email": "incomplete@example.com"
        })
        
        assert response.status_code == 422  # Validation error


class TestAuthProtection:
    """Tests for authentication protection"""
    
    def test_auth_me_requires_authentication(self):
        """Test that /api/auth/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        assert "Not authenticated" in response.json().get("detail", "")
    
    def test_profile_requires_authentication(self):
        """Test that /api/profile requires authentication"""
        response = requests.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 401
    
    def test_links_requires_authentication(self):
        """Test that /api/links requires authentication"""
        response = requests.get(f"{BASE_URL}/api/links")
        assert response.status_code == 401
    
    def test_analytics_requires_authentication(self):
        """Test that /api/analytics requires authentication"""
        response = requests.get(f"{BASE_URL}/api/analytics")
        assert response.status_code == 401
    
    def test_invalid_session_rejected(self):
        """Test that invalid session tokens are rejected"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": "invalid_token_12345"}
        )
        assert response.status_code == 401
        assert "Invalid session" in response.json().get("detail", "")


class TestPublicProfileAccess:
    """Tests for public profile access (no auth required)"""
    
    def test_public_profile_accessible_without_auth(self):
        """Test that public profiles are accessible without authentication"""
        # First create a user with a profile via supabase-sync
        timestamp = int(time.time())
        sync_response = requests.post(f"{BASE_URL}/api/auth/supabase-sync", json={
            "supabase_user_id": f"public_test_{timestamp}",
            "email": f"public_test_{timestamp}@example.com",
            "name": "Public Test User"
        })
        assert sync_response.status_code == 200
        
        # Get the session cookie
        session_token = sync_response.cookies.get("session_token")
        
        # Get the profile to find the username
        profile_response = requests.get(
            f"{BASE_URL}/api/profile",
            cookies={"session_token": session_token}
        )
        assert profile_response.status_code == 200
        username = profile_response.json().get("username")
        
        # Now test public access without auth
        public_response = requests.get(f"{BASE_URL}/api/public/{username}")
        assert public_response.status_code == 200
        data = public_response.json()
        assert "profile" in data
        assert "links" in data
    
    def test_public_profile_404_for_nonexistent(self):
        """Test that nonexistent profiles return 404"""
        response = requests.get(f"{BASE_URL}/api/public/nonexistent_user_xyz123")
        assert response.status_code == 404
        assert "Profile not found" in response.json().get("detail", "")


class TestForgotPassword:
    """Tests for forgot password functionality (uses Supabase)"""
    
    def test_forgot_password_endpoint_exists(self):
        """Test that forgot password endpoint exists (placeholder)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "test@example.com"
        })
        # Should return 200 (always returns success for security)
        assert response.status_code == 200
    
    def test_forgot_password_returns_success_for_any_email(self):
        """Test that forgot password returns success even for non-existent emails (security)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent_email_xyz@example.com"
        })
        assert response.status_code == 200


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root_returns_info(self):
        """Test that API root returns version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "FlexCard" in data["message"]
        assert data.get("database") == "Supabase"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
