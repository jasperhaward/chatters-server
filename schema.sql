CREATE TABLE user_account(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT current_timestamp,
    username varchar(50) UNIQUE NOT NULL,
    password varchar(250) NOT NULL
);

CREATE TABLE user_token(
    token_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT current_timestamp,
    user_id uuid REFERENCES user_account (user_id)
);

CREATE TABLE conversation(
    conversation_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT current_timestamp,
    created_by uuid REFERENCES user_account (user_id),
    title varchar(20)
);

CREATE TABLE conversation_message(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT current_timestamp,
    created_by uuid REFERENCES user_account (user_id),
    conversation_id uuid REFERENCES conversation (conversation_id),
    content varchar(250) NOT NULL
);

CREATE VIEW conversation_latest_message AS
    SELECT DISTINCT ON (m.conversation_id) *
    FROM conversation_message m
    ORDER BY m.conversation_id, m.created_at DESC;

CREATE TABLE conversation_recipient(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT current_timestamp,
    conversation_id uuid REFERENCES conversation (conversation_id),
    user_id uuid REFERENCES user_account (user_id)
);