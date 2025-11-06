-- The reference SQL CRUDs to model with postgres ORM

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name NOT NULL,
    last_name NOT NULL
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    -- add more
);


CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    org_name TEXT NOT NULL,
    description TEXT,
    admins -- continue 
    ,
    members -- continue
);


CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    organization_id INT,
    title TEXT NOT NULL,
    start_date TIMESTAMP DEFAULT NOW(),
    start_date TIMESTAMP DEFAULT NOW(),
    ends_at TIMESTAMP,
    active BOOLEAN,
    matching_requests JSON,
    participants --finish


);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    is_global BOOLEAN,
    organization_id INT,
    event_id int,
    options JSON

);

CREATE TABLE IF NOT EXISTS responses (
    id SERIAL PRIMARY KEY,
    question_id INT,
    user_id INT,
    answer TEXT
);


CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    event_id int,
    pairings JSON
);