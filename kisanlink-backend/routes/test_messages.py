# test_messages.py
import psycopg2

def test_messages():
    conn = psycopg2.connect(
        host="localhost",
        database="kisanlink_db",
        user="kisanlink_user",
        password="password123"
    )
    
    cur = conn.cursor()
    
    # Check messages table structure
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'messages'
    """)
    columns = cur.fetchall()
    print("Messages table columns:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
    
    # Check if there are any messages
    cur.execute("SELECT COUNT(*) FROM messages")
    count = cur.fetchone()[0]
    print(f"\nTotal messages in database: {count}")
    
    # Show some sample messages
    cur.execute("""
        SELECT m.id, u1.fullname as sender, u2.fullname as receiver, 
               m.content, m.timestamp
        FROM messages m
        JOIN users u1 ON m.sender_id = u1.id
        JOIN users u2 ON m.receiver_id = u2.id
        LIMIT 5
    """)
    messages = cur.fetchall()
    
    print("\nSample messages:")
    for msg in messages:
        print(f"  ID: {msg[0]}, From: {msg[1]}, To: {msg[2]}")
        print(f"  Content: {msg[3]}")
        print(f"  Time: {msg[4]}")
        print()
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    test_messages()