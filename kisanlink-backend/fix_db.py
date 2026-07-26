# fix_db.py - COMPLETED WITH ENFORCED CLOUD SECURITY HEADER
import psycopg2

# We pass sslmode as a strict parameter key requirement to prevent Render firewall rejections
db_config = {
    "host": "dpg-dsiq5t3so5us73ab5sa8-a.singapore-postgres.render.com",
    "database": "kisanlink_db",
    "user": "kisanlink_user",
    "password": "xVruOfqyRlS0nd3s7SaBSsaS-a",
    "port": 5432,
    "sslmode": "require"  # 🚀 THIS REPAIRS THE SSL HANDSHAKE UNEXPECTED CLOSURE
}

print("🔄 Launching direct SECURE pipeline connection to Singapore cloud server...")

try:
    # Connect directly using the secure configuration dictionary parameters
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    print("🏗️ Injecting required structural columns into 'users' table...")
    
    # Inject missing fields required by your auth logic blueprints
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);")
    
    # Force verification status upgrades on prior testing profiles
    cur.execute("UPDATE users SET is_active = TRUE, is_email_verified = TRUE WHERE is_active IS NULL OR is_email_verified IS NULL;")
    
    # Lock transformations into the live cloud cluster schema
    conn.commit()
    print("\n✅ SUCCESS: Cloud database tables updated perfectly!")
    
except Exception as database_error:
    print(f"\n❌ CONSOLE TERMINATED ERROR: {database_error}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
