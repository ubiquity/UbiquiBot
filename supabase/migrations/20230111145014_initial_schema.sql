CREATE TYPE issue_status AS ENUM (
  'READY_TO_START',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE'
);

CREATE TABLE users (
    user_login character varying(255) NOT NULL PRIMARY KEY,
    user_type character varying(255),
    user_name character varying(255) NOT NULL,
    company character varying(255),
    blog text,
    user_location text,
    email text,
    bio text,
    twitter_username text,
    public_repos integer,
    followers integer,
    following integer,
    contributions text,
    percent_commits integer,
    percent_pull_requests integer,
    percent_issues integer,
    percent_code_reviews integer,
    wallet_address character(42),
    created_at text,
    updated_at text
);
