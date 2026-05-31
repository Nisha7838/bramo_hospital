-- brahmo_schema.sql
CREATE DATABASE IF NOT EXISTS brahmo_db;
USE brahmo_db;

CREATE TABLE organizations (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hierarchy_levels (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    level_number INT NOT NULL,
    level_name TEXT NOT NULL,
    department VARCHAR(50),
    FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE knowledge_nodes (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    hierarchy_level_id VARCHAR(50),
    type ENUM('CONSTRAINT','DECISION','ANTI_PATTERN','FACT') NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    importance DECIMAL(3,2) NOT NULL,
    status ENUM('ACTIVE','REVIEW_REQUIRED','SUPERSEDED','PENDING_CONFIRMATION','DISMISSED') DEFAULT 'ACTIVE',
    department VARCHAR(50),
    zone INT DEFAULT 1,
    embedding JSON,
    source VARCHAR(20) DEFAULT 'MANUAL',
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id),
    FOREIGN KEY (hierarchy_level_id) REFERENCES hierarchy_levels(id)
);

CREATE TABLE capture_candidates (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    org_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(50),
    transcript TEXT NOT NULL,
    candidate_type VARCHAR(20) NOT NULL,
    candidate_title TEXT NOT NULL,
    candidate_content TEXT NOT NULL,
    importance DECIMAL(3,2),
    confidence DECIMAL(3,2) NOT NULL,
    routing_tier ENUM('HIGH','MEDIUM','LOW') NOT NULL,
    suggested_level VARCHAR(20),
    department VARCHAR(50),
    conflict_type ENUM('DUPLICATE','UPDATE','COEXIST','NEW','SUPERSEDE'),
    conflict_node_id VARCHAR(50),
    conflict_similarity DECIMAL(4,3),
    status ENUM('PENDING','AUTO_CAPTURED','CONFIRMED','MERGED','DISMISSED','UNDONE') DEFAULT 'PENDING',
    action_taken TEXT,
    action_reason TEXT,
    reviewed_by VARCHAR(50),
    reviewed_at TIMESTAMP NULL,
    node_id VARCHAR(50),
    embedding JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE patients (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    age INT,
    gender VARCHAR(10),
    conditions JSON,
    notes TEXT
);

CREATE TABLE event_log (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    payload JSON,
    actor_id VARCHAR(50) NOT NULL,
    org_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
