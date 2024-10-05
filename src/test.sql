CREATE TABLE conversation_event(
    id serial PRIMARY KEY,
    type varchar(30) NOT NULL,
    conversation_id uuid NOT NULL,
    created_at timestamptz DEFAULT current_timestamp,
    created_by uuid NOT NULL REFERENCES user_account (user_id),
    recipient_user_id uuid REFERENCES user_account (user_id),
    conversation_title varchar(30),
    message_content varchar(250)
);

CREATE VIEW user_conversation AS
    SELECT conversation_id, recipient_user_id AS user_id
    FROM conversation_event 
    WHERE (type = 'RecipientCreated' OR type = 'RecipientRemoved') 
    GROUP BY conversation_id, recipient_user_id
    HAVING SUM(
        CASE 
            WHEN type = 'RecipientCreated' THEN 1 
            ELSE -1
        END
    ) > 0;

    SELECT conversation_id, recipient_user_id AS user_id
FROM conversation_event 
WHERE (type = 'RecipientCreated' OR type = 'RecipientRemoved') 
GROUP BY conversation_id, recipient_user_id
HAVING SUM(
	CASE 
		WHEN type = 'RecipientCreated' THEN 1 
		ELSE -1
	END
) > 0;