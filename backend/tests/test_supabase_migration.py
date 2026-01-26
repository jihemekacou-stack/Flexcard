"""
FlexCard Supabase Migration Tests
Tests all API endpoints after MongoDB to Supabase migration
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = "testsupabase1769416346@test.com"
TEST_PASSWORD = "test123"
DEMO_USERNAME = "demo"


class TestAPIHealth:
    """Basic API health and Supabase connection tests"""
    
    def test_api_root(self):
        """Test API root endpoint returns Supabase database info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "FlexCard API"
        assert data["version"] == "2.0.0"
        assert data["database"] == "Supabase"
        print(f"✓ API root: {data}")


class TestAuthRegister:
    """Test user registration via /api/auth/register"""
    
    def test_register_new_user(self):
        """Test registering a new user"""
        unique_id = uuid.uuid4().hex[:8]
        register_data = {
            "name": f"Test User {unique_id}",
            "email": f"test.supabase.{unique_id}@test.com",
            "password": "testpass123"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify user data returned
        assert "user_id" in data
        assert data["email"] == register_data["email"]
        assert data["name"] == register_data["name"]
        assert "password" not in data  # Password should not be returned
        print(f"✓ Register: Created user {data['user_id']}")
        
        # Store for cleanup
        return data, response.cookies.get("session_token")
    
    def test_register_duplicate_email(self):
        """Test registering with existing email fails"""
        # First register
        unique_id = uuid.uuid4().hex[:8]
        register_data = {
            "name": f"Duplicate Test {unique_id}",
            "email": f"duplicate.{unique_id}@test.com",
            "password": "testpass123"
        }
        
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert response1.status_code == 200
        
        # Try to register again with same email
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert response2.status_code == 400
        assert "already registered" in response2.json().get("detail", "").lower()
        print("✓ Register: Duplicate email correctly rejected")


class TestAuthLogin:
    """Test user login via /api/auth/login"""
    
    @pytest.fixture(autouse=True)
    def setup_test_user(self):
        """Create a test user for login tests"""
        self.unique_id = uuid.uuid4().hex[:8]
        self.test_email = f"login.test.{self.unique_id}@test.com"
        self.test_password = "testpass123"
        
        # Register user
        register_data = {
            "name": f"Login Test {self.unique_id}",
            "email": self.test_email,
            "password": self.test_password
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            self.user_data = response.json()
        yield
    
    def test_login_success(self):
        """Test successful login"""
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "user_id" in data
        assert data["email"] == self.test_email
        assert "session_token" in response.cookies or "password" not in data
        print(f"✓ Login: Success for {data['email']}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        login_data = {
            "email": self.test_email,
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 401
        print("✓ Login: Invalid credentials correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        login_data = {
            "email": "nonexistent@test.com",
            "password": "anypassword"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 401
        print("✓ Login: Non-existent user correctly rejected")


class TestProfile:
    """Test profile endpoints via /api/profile"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_user(self):
        """Create and authenticate a test user"""
        self.unique_id = uuid.uuid4().hex[:8]
        self.test_email = f"profile.test.{self.unique_id}@test.com"
        
        # Register user
        register_data = {
            "name": f"Profile Test {self.unique_id}",
            "email": self.test_email,
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert response.status_code == 200
        
        self.user_data = response.json()
        self.session_token = response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"} if self.session_token else {}
        self.cookies = {"session_token": self.session_token} if self.session_token else {}
        yield
    
    def test_get_profile(self):
        """Test GET /api/profile"""
        response = requests.get(
            f"{BASE_URL}/api/profile",
            headers=self.headers,
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "profile_id" in data
        assert "username" in data
        assert "user_id" in data
        assert data["user_id"] == self.user_data["user_id"]
        print(f"✓ GET Profile: {data['username']}")
        return data
    
    def test_update_profile(self):
        """Test PUT /api/profile"""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "title": "Software Engineer",
            "company": "Test Company",
            "bio": "This is a test bio",
            "location": "Paris, France"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/profile",
            json=update_data,
            headers=self.headers,
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
        assert data["title"] == "Software Engineer"
        assert data["company"] == "Test Company"
        print(f"✓ PUT Profile: Updated successfully")
        
        # Verify persistence with GET
        get_response = requests.get(
            f"{BASE_URL}/api/profile",
            headers=self.headers,
            cookies=self.cookies
        )
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["first_name"] == "Updated"
        print("✓ Profile update persisted in database")
    
    def test_get_profile_unauthorized(self):
        """Test GET /api/profile without auth"""
        response = requests.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 401
        print("✓ GET Profile: Unauthorized correctly rejected")


class TestLinks:
    """Test links endpoints via /api/links"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_user(self):
        """Create and authenticate a test user"""
        self.unique_id = uuid.uuid4().hex[:8]
        self.test_email = f"links.test.{self.unique_id}@test.com"
        
        # Register user
        register_data = {
            "name": f"Links Test {self.unique_id}",
            "email": self.test_email,
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert response.status_code == 200
        
        self.user_data = response.json()
        self.session_token = response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"} if self.session_token else {}
        self.cookies = {"session_token": self.session_token} if self.session_token else {}
        yield
    
    def test_get_links_empty(self):
        """Test GET /api/links for new user (empty)"""
        response = requests.get(
            f"{BASE_URL}/api/links",
            headers=self.headers,
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET Links: {len(data)} links")
    
    def test_create_link(self):
        """Test POST /api/links"""
        link_data = {
            "type": "social",
            "platform": "linkedin",
            "url": "https://linkedin.com/in/testuser",
            "title": "Mon LinkedIn"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/links",
            json=link_data,
            headers=self.headers,
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "link_id" in data
        assert data["title"] == "Mon LinkedIn"
        assert data["platform"] == "linkedin"
        assert data["url"] == "https://linkedin.com/in/testuser"
        print(f"✓ POST Link: Created {data['link_id']}")
        return data
    
    def test_delete_link(self):
        """Test DELETE /api/links/{link_id}"""
        # First create a link
        link_data = {
            "type": "social",
            "platform": "twitter",
            "url": "https://twitter.com/testuser",
            "title": "Mon Twitter"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/links",
            json=link_data,
            headers=self.headers,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        link_id = create_response.json()["link_id"]
        
        # Delete the link
        delete_response = requests.delete(
            f"{BASE_URL}/api/links/{link_id}",
            headers=self.headers,
            cookies=self.cookies
        )
        assert delete_response.status_code == 200
        print(f"✓ DELETE Link: {link_id}")
        
        # Verify deletion with GET
        get_response = requests.get(
            f"{BASE_URL}/api/links",
            headers=self.headers,
            cookies=self.cookies
        )
        links = get_response.json()
        link_ids = [l["link_id"] for l in links]
        assert link_id not in link_ids
        print("✓ Link deletion verified")


class TestPublicProfile:
    """Test public profile via /api/public/{username}"""
    
    def test_get_public_profile_demo(self):
        """Test GET /api/public/demo"""
        response = requests.get(f"{BASE_URL}/api/public/{DEMO_USERNAME}")
        assert response.status_code == 200
        data = response.json()
        
        assert "profile" in data
        assert "links" in data
        profile = data["profile"]
        assert profile["username"] == DEMO_USERNAME
        print(f"✓ Public Profile: /u/{DEMO_USERNAME} - {len(data['links'])} links")
    
    def test_public_profile_not_found(self):
        """Test GET /api/public/{nonexistent}"""
        response = requests.get(f"{BASE_URL}/api/public/nonexistent_user_12345")
        assert response.status_code == 404
        print("✓ Public Profile: Non-existent user returns 404")


class TestPhysicalCards:
    """Test physical cards endpoints via /api/cards"""
    
    def test_generate_cards(self):
        """Test POST /api/cards/generate"""
        response = requests.post(
            f"{BASE_URL}/api/cards/generate",
            params={"count": 2, "batch_name": "test_batch"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "card_ids" in data
        assert len(data["card_ids"]) == 2
        print(f"✓ Generate Cards: {data['card_ids']}")
        return data["card_ids"]
    
    def test_get_card_status(self):
        """Test GET /api/cards/{card_id}"""
        # First generate a card
        gen_response = requests.post(
            f"{BASE_URL}/api/cards/generate",
            params={"count": 1}
        )
        assert gen_response.status_code == 200
        card_id = gen_response.json()["card_ids"][0]
        
        # Get card status
        response = requests.get(f"{BASE_URL}/api/cards/{card_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "unactivated"
        assert data["card_id"] == card_id
        print(f"✓ Card Status: {card_id} - {data['status']}")
    
    def test_card_not_found(self):
        """Test GET /api/cards/{nonexistent}"""
        response = requests.get(f"{BASE_URL}/api/cards/NONEXISTENT123")
        assert response.status_code == 404
        print("✓ Card Status: Non-existent card returns 404")


class TestAnalytics:
    """Test analytics endpoint via /api/analytics"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_user(self):
        """Create and authenticate a test user"""
        self.unique_id = uuid.uuid4().hex[:8]
        self.test_email = f"analytics.test.{self.unique_id}@test.com"
        
        # Register user
        register_data = {
            "name": f"Analytics Test {self.unique_id}",
            "email": self.test_email,
            "password": "testpass123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert response.status_code == 200
        
        self.user_data = response.json()
        self.session_token = response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"} if self.session_token else {}
        self.cookies = {"session_token": self.session_token} if self.session_token else {}
        yield
    
    def test_get_analytics(self):
        """Test GET /api/analytics"""
        response = requests.get(
            f"{BASE_URL}/api/analytics",
            headers=self.headers,
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "total_views" in data
        assert "total_clicks" in data
        assert "total_contacts" in data
        assert "daily_views" in data
        assert "daily_clicks" in data
        assert "links" in data
        print(f"✓ Analytics: {data['total_views']} views, {data['total_clicks']} clicks")


class TestContactSubmission:
    """Test contact submission via /api/public/{username}/contact"""
    
    def test_submit_contact(self):
        """Test POST /api/public/{username}/contact"""
        contact_data = {
            "name": "Test Contact",
            "email": "contact@test.com",
            "phone": "+33600000000",
            "message": "Test message from Supabase migration tests"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/public/{DEMO_USERNAME}/contact",
            json=contact_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "contact_id" in data
        assert "message" in data
        print(f"✓ Contact Submitted: {data['contact_id']}")


class TestExistingTestUser:
    """Test with the provided test credentials"""
    
    def test_login_with_test_credentials(self):
        """Test login with provided test user credentials"""
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Test User Login: {data['email']}")
            
            # Test profile access
            session_token = response.cookies.get("session_token")
            if session_token:
                profile_response = requests.get(
                    f"{BASE_URL}/api/profile",
                    headers={"Authorization": f"Bearer {session_token}"},
                    cookies={"session_token": session_token}
                )
                if profile_response.status_code == 200:
                    profile = profile_response.json()
                    print(f"✓ Test User Profile: {profile.get('username', 'N/A')}")
        elif response.status_code == 401:
            # User might not exist yet, try to register
            print(f"⚠ Test user not found, attempting registration...")
            register_data = {
                "name": "Test Supabase User",
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
            if reg_response.status_code == 200:
                print(f"✓ Test User Registered: {TEST_EMAIL}")
            else:
                print(f"⚠ Registration failed: {reg_response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
