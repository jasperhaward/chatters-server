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

CREATE VIEW conversation_created_es AS
    SELECT
        e.id, 
        e.conversation_id,
        e.event_type, 
        e.created_at, 
        e.created_by, 
        u.username AS created_by_username
    FROM conversation_event AS e
    INNER JOIN user_account AS u ON u.user_id = e.created_by
    WHERE event_type = 'ConversationCreated'
    
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
    SELECT DISTINCT ON (e.conversation_id, e.recipient_id)
        e.id, 
        e.conversation_id, 
        e.event_type, 
        e.created_at, 
        e.created_by, 
        cu.username AS created_by_username,
        e.recipient_id,
        ru.username AS recipient_username
    FROM conversation_event AS e
    INNER JOIN recipients AS r ON r.conversation_id = e.conversation_id AND r.recipient_id = e.recipient_id
    INNER JOIN user_account AS cu ON cu.user_id = e.created_by
    INNER JOIN user_account AS ru ON ru.user_id = e.recipient_id
    WHERE event_type = 'RecipientCreated'
    ORDER BY e.conversation_id, e.recipient_id, created_at DESC 

CREATE VIEW conversation_latest_event_es AS
    SELECT DISTINCT ON (e.conversation_id)
        e.id, 
        e.conversation_id,
        e.event_type, 
        e.created_at, 
        e.created_by, 
        cu.username AS created_by_username,
        e.message,
        e.title,
        e.recipient_id,
        ru.username AS recipient_username 
    FROM conversation_event AS e
    INNER JOIN user_account AS cu ON cu.user_id = e.created_by
    LEFT JOIN user_account AS ru ON ru.user_id = e.recipient_id
    ORDER BY conversation_id, e.created_at DESC 