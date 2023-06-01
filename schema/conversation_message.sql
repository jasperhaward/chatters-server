CREATE TABLE conversation_message(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp DEFAULT current_timestamp,
    conversation_id uuid REFERENCES conversation (conversation_id),
    content varchar(250) NOT NULL,
    created_by uuid REFERENCES user_account (user_id)
);