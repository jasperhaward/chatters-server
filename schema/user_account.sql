CREATE TABLE user_account(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username varchar(50) UNIQUE NOT NULL,
    password varchar(250) NOT NULL
);