CREATE TABLE user_token(
    token_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES user_account (user_id)
);