# utils/email_service.py - WORKING EMAIL SERVICE
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class EmailService:
    def __init__(self):
        self.sender_email = os.getenv("EMAIL_USER")
        self.sender_password = os.getenv("EMAIL_PASSWORD")
        
        if self.sender_email and self.sender_password:
            self.enabled = True
            print(f"✅ Email service configured: {self.sender_email}")
        else:
            self.enabled = False
            print("⚠️ Email service DISABLED - Add EMAIL_USER and EMAIL_PASSWORD to .env file")
            print("   For testing, email links will be printed to console")
    
    def send_verification_email(self, to_email, token, name):
        """Send verification email"""
        verification_link = f"http://localhost:5001/auth/verify-email/{token}"
        
        print(f"\n📧 EMAIL VERIFICATION for: {to_email}")
        
        if not self.enabled:
            print("   ⚠️ Email service disabled - check .env file")
            print(f"   🔗 Verification link: {verification_link}")
            print(f"   👤 Name: {name}")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Verify Your Email - KisanLink'
            msg['From'] = f'KisanLink <{self.sender_email}>'
            msg['To'] = to_email
            
            # Text version
            text = f"""
            Welcome to KisanLink!
            
            Hello {name},
            
            Please verify your email address by clicking this link:
            {verification_link}
            
            This link will expire in 24 hours.
            
            If you didn't create this account, please ignore this email.
            
            Best regards,
            KisanLink Team
            """
            
            # HTML version
            html = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #2E7D32;">Welcome to KisanLink!</h2>
                    <p>Hello <strong>{name}</strong>,</p>
                    
                    <p>Please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" 
                           style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link in your browser:</p>
                    <div style="background: #eee; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <code>{verification_link}</code>
                    </div>
                    
                    <p><strong>Note:</strong> This link expires in 24 hours.</p>
                    
                    <p>Best regards,<br>KisanLink Team</p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(text, 'plain'))
            msg.attach(MIMEText(html, 'html'))
            
            # Send email
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            print(f"   ✅ Verification email SENT to {to_email}")
            return True
            
        except Exception as e:
            print(f"   ❌ Failed to send email: {e}")
            print(f"   🔗 Fallback link: {verification_link}")
            return False
    
    def send_welcome_email(self, to_email, name):
        """Send welcome email after verification"""
        if not self.enabled:
            print(f"📧 Welcome email would be sent to {to_email}")
            return True
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Welcome to KisanLink!'
            msg['From'] = f'KisanLink <{self.sender_email}>'
            msg['To'] = to_email
            
            text = f"""
            Welcome to KisanLink!
            
            Hello {name},
            
            Your email has been verified successfully. Welcome to KisanLink!
            
            You can now login and start using our platform.
            
            Login here: http://localhost:3000/login
            
            Best regards,
            KisanLink Team
            """
            
            msg.attach(MIMEText(text, 'plain'))
            
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"⚠️ Welcome email failed: {e}")
            return False

# Create instance
email_service = EmailService()