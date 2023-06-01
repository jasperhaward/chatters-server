CREATE TABLE conversation_recipient(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid REFERENCES conversation (conversation_id),
    user_id uuid REFERENCES user_account (user_id)
);