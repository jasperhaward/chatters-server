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
    ORDER BY conversation_id, created_at DESC 