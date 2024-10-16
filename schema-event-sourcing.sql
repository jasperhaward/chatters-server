CREATE TABLE user_account(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username varchar(50) UNIQUE NOT NULL,
    created_at timestamptz DEFAULT current_timestamp
);

CREATE TABLE user_password(
    user_id uuid PRIMARY KEY REFERENCES user_account (user_id)
    password_hash varchar(250) NOT NULL
);

CREATE TABLE user_token(
    token_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES user_account (user_id),
    created_at timestamptz DEFAULT current_timestamp
);

CREATE TABLE conversation_event(
    id serial PRIMARY KEY,
    event_type varchar(30) NOT NULL,
    conversation_id uuid NOT NULL,
    created_at timestamptz DEFAULT current_timestamp,
    created_by uuid NOT NULL REFERENCES user_account (user_id),
    /* Optional - depending on event type */
    title varchar(30),
    recipient_id uuid REFERENCES user_account (user_id),
    message varchar(250)
);
    
CREATE VIEW conversation_recipient_es AS 
    WITH recipients AS (
        SELECT conversation_id, recipient_id
        FROM conversation_event
        WHERE event_type = 'RecipientCreated' OR event_type = 'RecipientRemoved'
        GROUP BY conversation_id, recipient_id
        HAVING
            SUM(
                CASE
                    WHEN event_type = 'RecipientCreated' THEN 1
                    WHEN event_type = 'RecipientRemoved' THEN -1
                    ELSE 0
                END
            ) > 0
        )
    SELECT conversation_id, user_id, username
    FROM recipients
    INNER JOIN user_account ON user_id = recipient_id

CREATE VIEW conversation_latest_message_es AS
    SELECT DISTINCT ON (conversation_id) *
    FROM conversation_event
    INNER JOIN user_account ON user_id = created_by
    WHERE event_type = 'MessageCreated'
    ORDER BY conversation_id, created_at DESC 