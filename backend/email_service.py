"""
Email Service Module using Resend
Handles all transactional emails for FlexCard
"""

import os
import asyncio
import logging
import resend
from datetime import datetime

logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "FlexCard <onboarding@resend.dev>")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://flexcard.co")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Brand colors
PRIMARY_COLOR = "#8645D6"
DARK_COLOR = "#1a1a2e"

def get_base_template(content: str, title: str = "FlexCard") -> str:
    """Base HTML email template with FlexCard branding"""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, {PRIMARY_COLOR} 0%, #6b21a8 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">FlexCard</h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Votre carte de visite digitale</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            {content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                                © {datetime.now().year} FlexCard. Tous droits réservés.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                Cet email a été envoyé par FlexCard. Si vous n'avez pas demandé cet email, ignorez-le.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

def get_welcome_email(user_name: str, verification_link: str = None) -> tuple:
    """Welcome email for new users"""
    subject = "Bienvenue sur FlexCard ! 🎉"
    
    verification_section = ""
    if verification_link:
        verification_section = f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_link}" style="display: inline-block; background: linear-gradient(135deg, {PRIMARY_COLOR} 0%, #6b21a8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Confirmer mon email
            </a>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px;">
            Ou copiez ce lien : <span style="color: {PRIMARY_COLOR};">{verification_link}</span>
        </p>
        """
    
    content = f"""
    <h2 style="margin: 0 0 16px; color: {DARK_COLOR}; font-size: 24px;">Bonjour {user_name} ! 👋</h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Bienvenue sur <strong>FlexCard</strong> ! Nous sommes ravis de vous compter parmi nous.
    </p>
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Avec FlexCard, créez votre carte de visite digitale professionnelle et partagez-la en un instant via QR code ou lien.
    </p>
    {verification_section}
    <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-top: 24px;">
        <h3 style="margin: 0 0 12px; color: {DARK_COLOR}; font-size: 16px;">🚀 Prochaines étapes :</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
            <li>Complétez votre profil avec vos informations</li>
            <li>Ajoutez vos réseaux sociaux</li>
            <li>Partagez votre carte avec vos contacts</li>
        </ul>
    </div>
    """
    
    return subject, get_base_template(content, subject)

def get_password_reset_email(user_name: str, reset_link: str) -> tuple:
    """Password reset email"""
    subject = "Réinitialisation de votre mot de passe FlexCard"
    
    content = f"""
    <h2 style="margin: 0 0 16px; color: {DARK_COLOR}; font-size: 24px;">Bonjour {user_name},</h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Vous avez demandé à réinitialiser votre mot de passe FlexCard.
    </p>
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{reset_link}" style="display: inline-block; background: linear-gradient(135deg, {PRIMARY_COLOR} 0%, #6b21a8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Réinitialiser mon mot de passe
        </a>
    </div>
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px;">
        Ce lien expire dans 1 heure.
    </p>
    <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; margin-top: 24px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Vous n'avez pas fait cette demande ?</strong><br>
            Ignorez cet email, votre mot de passe restera inchangé.
        </p>
    </div>
    """
    
    return subject, get_base_template(content, subject)

def get_email_verification_email(user_name: str, verification_link: str) -> tuple:
    """Email verification email"""
    subject = "Confirmez votre adresse email - FlexCard"
    
    content = f"""
    <h2 style="margin: 0 0 16px; color: {DARK_COLOR}; font-size: 24px;">Bonjour {user_name},</h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Merci de vous être inscrit sur FlexCard ! 
    </p>
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Pour activer votre compte, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{verification_link}" style="display: inline-block; background: linear-gradient(135deg, {PRIMARY_COLOR} 0%, #6b21a8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Confirmer mon email
        </a>
    </div>
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px;">
        Ce lien expire dans 24 heures.
    </p>
    """
    
    return subject, get_base_template(content, subject)

def get_card_activation_email(user_name: str, card_id: str, profile_link: str) -> tuple:
    """Card activation confirmation email"""
    subject = f"Votre carte FlexCard {card_id} est activée ! 🎉"
    
    content = f"""
    <h2 style="margin: 0 0 16px; color: {DARK_COLOR}; font-size: 24px;">Félicitations {user_name} ! 🎉</h2>
    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
        Votre carte FlexCard <strong style="color: {PRIMARY_COLOR};">{card_id}</strong> a été activée avec succès !
    </p>
    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
        Quand quelqu'un scanne le QR code de votre carte, il sera redirigé vers votre profil FlexCard.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{profile_link}" style="display: inline-block; background: linear-gradient(135deg, {PRIMARY_COLOR} 0%, #6b21a8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Voir mon profil
        </a>
    </div>
    <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin-top: 24px;">
        <h3 style="margin: 0 0 12px; color: {DARK_COLOR}; font-size: 16px;">💡 Conseils :</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
            <li>Gardez votre carte dans votre portefeuille</li>
            <li>Partagez votre carte lors de vos rencontres professionnelles</li>
            <li>Consultez vos analytics pour voir qui visite votre profil</li>
        </ul>
    </div>
    """
    
    return subject, get_base_template(content, subject)

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send an email using Resend"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, email not sent")
        return {"status": "skipped", "message": "Email service not configured"}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {to_email}: {result}")
        return {"status": "success", "message": f"Email sent to {to_email}", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"status": "error", "message": str(e)}

async def send_welcome_email(to_email: str, user_name: str, verification_link: str = None) -> dict:
    """Send welcome email to new user"""
    subject, html = get_welcome_email(user_name, verification_link)
    return await send_email(to_email, subject, html)

async def send_password_reset_email(to_email: str, user_name: str, reset_link: str) -> dict:
    """Send password reset email"""
    subject, html = get_password_reset_email(user_name, reset_link)
    return await send_email(to_email, subject, html)

async def send_verification_email(to_email: str, user_name: str, verification_link: str) -> dict:
    """Send email verification email"""
    subject, html = get_email_verification_email(user_name, verification_link)
    return await send_email(to_email, subject, html)

async def send_card_activation_email(to_email: str, user_name: str, card_id: str, profile_link: str) -> dict:
    """Send card activation confirmation email"""
    subject, html = get_card_activation_email(user_name, card_id, profile_link)
    return await send_email(to_email, subject, html)
