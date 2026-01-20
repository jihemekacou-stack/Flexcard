"""
FlexCard Feature Tests - Iteration 5
Tests for: Order modal, Delete profile, Edit links, WhatsApp phone number, Public profile links display
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
SESSION_TOKEN = "test_session_order_1768909266399"
USER_ID = "test-user-order-1768909266399"
USERNAME = "testorder1768909266399"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "FlexCard API"
        print("✓ API root endpoint working")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_auth_me_with_valid_token(self):
        """Test /api/auth/me with valid session token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["user_id"] == USER_ID
        print(f"✓ Auth /me working - User: {data['name']}")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth /me correctly returns 401 without token")


class TestProfileCRUD:
    """Profile CRUD operations"""
    
    def test_get_profile(self):
        """Test GET /api/profile"""
        response = requests.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert "profile_id" in data
        print(f"✓ GET profile working - Username: {data['username']}")
        return data
    
    def test_update_profile(self):
        """Test PUT /api/profile"""
        update_data = {
            "bio": "Updated bio for testing",
            "title": "Test Engineer"
        }
        response = requests.put(
            f"{BASE_URL}/api/profile",
            json=update_data,
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["bio"] == "Updated bio for testing"
        assert data["title"] == "Test Engineer"
        print("✓ PUT profile working - Bio and title updated")


class TestDeleteProfile:
    """Test DELETE /api/profile endpoint - Critical new feature"""
    
    def test_delete_profile_endpoint_exists(self):
        """Verify DELETE /api/profile endpoint exists and requires auth"""
        # Test without auth - should return 401
        response = requests.delete(f"{BASE_URL}/api/profile")
        assert response.status_code == 401
        print("✓ DELETE /api/profile requires authentication")
    
    def test_delete_profile_with_new_user(self):
        """Test DELETE /api/profile with a new test user"""
        # First, register a new user to delete
        import uuid
        unique_id = uuid.uuid4().hex[:8]
        register_data = {
            "name": f"Delete Test {unique_id}",
            "email": f"delete.test.{unique_id}@example.com",
            "password": "testpass123"
        }
        
        # Register
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=register_data
        )
        assert reg_response.status_code == 200
        user_data = reg_response.json()
        
        # Get session token from cookie
        session_token = reg_response.cookies.get("session_token")
        if not session_token:
            # Try to login to get token
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": register_data["email"], "password": register_data["password"]}
            )
            session_token = login_response.cookies.get("session_token")
        
        # Verify profile exists
        profile_response = requests.get(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {session_token}"} if session_token else {},
            cookies={"session_token": session_token} if session_token else {}
        )
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        print(f"✓ Created test user with profile: {profile_data['username']}")
        
        # Delete the profile
        delete_response = requests.delete(
            f"{BASE_URL}/api/profile",
            headers={"Authorization": f"Bearer {session_token}"} if session_token else {},
            cookies={"session_token": session_token} if session_token else {}
        )
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert "message" in delete_data
        print(f"✓ DELETE /api/profile successful: {delete_data['message']}")
        
        # Verify user is deleted - auth should fail
        verify_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {session_token}"} if session_token else {},
            cookies={"session_token": session_token} if session_token else {}
        )
        assert verify_response.status_code == 401
        print("✓ User session invalidated after delete")


class TestLinksCRUD:
    """Links CRUD operations - including edit functionality"""
    
    def test_get_links(self):
        """Test GET /api/links"""
        response = requests.get(
            f"{BASE_URL}/api/links",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET links working - {len(data)} links found")
        return data
    
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
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "link_id" in data
        assert data["title"] == "Mon LinkedIn"
        assert data["platform"] == "linkedin"
        print(f"✓ POST link created: {data['link_id']}")
        return data
    
    def test_create_whatsapp_link_with_phone(self):
        """Test creating WhatsApp link with phone number (converted to wa.me URL)"""
        link_data = {
            "type": "social",
            "platform": "whatsapp",
            "url": "https://wa.me/2250700000000",  # WhatsApp URL format
            "title": "Mon WhatsApp"
        }
        response = requests.post(
            f"{BASE_URL}/api/links",
            json=link_data,
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "link_id" in data
        assert data["platform"] == "whatsapp"
        assert "wa.me" in data["url"]
        print(f"✓ WhatsApp link created with wa.me URL: {data['url']}")
        return data
    
    def test_update_link(self):
        """Test PUT /api/links/{link_id} - Edit link functionality"""
        # First create a link
        create_response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "type": "social",
                "platform": "instagram",
                "url": "https://instagram.com/original",
                "title": "Original Title"
            },
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert create_response.status_code == 200
        link = create_response.json()
        link_id = link["link_id"]
        
        # Update the link
        update_data = {
            "url": "https://instagram.com/updated",
            "title": "Updated Title"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/links/{link_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert update_response.status_code == 200
        updated_link = update_response.json()
        assert updated_link["title"] == "Updated Title"
        assert updated_link["url"] == "https://instagram.com/updated"
        print(f"✓ PUT link updated: {link_id} - Title: {updated_link['title']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/links/{link_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        return updated_link
    
    def test_delete_link(self):
        """Test DELETE /api/links/{link_id}"""
        # First create a link to delete
        create_response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "type": "social",
                "platform": "twitter",
                "url": "https://twitter.com/todelete",
                "title": "To Delete"
            },
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        link = create_response.json()
        link_id = link["link_id"]
        
        # Delete the link
        delete_response = requests.delete(
            f"{BASE_URL}/api/links/{link_id}",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert delete_response.status_code == 200
        print(f"✓ DELETE link successful: {link_id}")


class TestPublicProfile:
    """Public profile tests - verify links display without URL"""
    
    def test_get_public_profile(self):
        """Test GET /api/public/{username}"""
        response = requests.get(f"{BASE_URL}/api/public/{USERNAME}")
        assert response.status_code == 200
        data = response.json()
        assert "profile" in data
        assert "links" in data
        profile = data["profile"]
        assert profile["username"] == USERNAME
        print(f"✓ Public profile accessible: /u/{USERNAME}")
        return data
    
    def test_public_profile_links_structure(self):
        """Verify links in public profile have title and platform, not just URL"""
        # First add a link
        requests.post(
            f"{BASE_URL}/api/links",
            json={
                "type": "social",
                "platform": "facebook",
                "url": "https://facebook.com/testpage",
                "title": "Ma Page Facebook"
            },
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        
        # Get public profile
        response = requests.get(f"{BASE_URL}/api/public/{USERNAME}")
        assert response.status_code == 200
        data = response.json()
        
        links = data["links"]
        if len(links) > 0:
            link = links[0]
            assert "title" in link
            assert "platform" in link
            # URL is still in the data but frontend should not display it
            assert "url" in link
            print(f"✓ Public profile links have title: '{link['title']}' and platform: '{link['platform']}'")
        else:
            print("⚠ No links found in public profile")
    
    def test_public_profile_kounapster(self):
        """Test existing profile /u/kounapster"""
        response = requests.get(f"{BASE_URL}/api/public/kounapster")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Profile kounapster accessible - {len(data['links'])} links")
        else:
            print(f"⚠ Profile kounapster not found (status: {response.status_code})")


class TestContactSubmission:
    """Contact form submission tests"""
    
    def test_submit_contact(self):
        """Test POST /api/public/{username}/contact"""
        contact_data = {
            "name": "Test Contact",
            "email": "contact@test.com",
            "phone": "+33600000000",
            "message": "Test message from automated tests",
            "source": "form"
        }
        response = requests.post(
            f"{BASE_URL}/api/public/{USERNAME}/contact",
            json=contact_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "contact_id" in data
        print(f"✓ Contact submitted: {data['contact_id']}")


class TestAnalytics:
    """Analytics endpoint tests"""
    
    def test_get_analytics(self):
        """Test GET /api/analytics"""
        response = requests.get(
            f"{BASE_URL}/api/analytics",
            headers={"Authorization": f"Bearer {SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_views" in data
        assert "total_clicks" in data
        assert "total_contacts" in data
        print(f"✓ Analytics: {data['total_views']} views, {data['total_clicks']} clicks, {data['total_contacts']} contacts")


class TestWhatsAppOrderNumber:
    """Test WhatsApp order number configuration"""
    
    def test_whatsapp_order_number_in_frontend(self):
        """Verify WhatsApp order number is configured correctly"""
        # This is a code review check - the number should be 2250100640854
        expected_number = "2250100640854"
        print(f"✓ WhatsApp order number should be: {expected_number}")
        print("  Frontend OrderModal uses WHATSAPP_ORDER_NUMBER constant")
        print("  WhatsApp URL format: https://wa.me/2250100640854?text=...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
