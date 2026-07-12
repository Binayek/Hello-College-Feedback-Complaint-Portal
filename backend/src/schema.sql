-- Hello College — Database Schema
-- Run: psql hello_college < schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--  Enum types 
CREATE TYPE user_role        AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE complaint_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE post_status      AS ENUM ('active', 'removed');
CREATE TYPE notif_type       AS ENUM (
  'complaint_submitted', 'complaint_assigned', 'complaint_status_changed',
  'community_comment', 'identity_revealed'
);

--  Faculties (departments) 
CREATE TABLE faculties (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  code       VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

--  Users 
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'student',
  faculty_id    UUID REFERENCES faculties(id) ON DELETE SET NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

--  Community Board Posts 
CREATE TABLE community_posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  title        VARCHAR(200) NOT NULL,
  content      TEXT NOT NULL,
  category     VARCHAR(80),
  status       post_status DEFAULT 'active',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

--  Community Post Comments 
CREATE TABLE post_comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  content      TEXT NOT NULL,
  status       post_status DEFAULT 'active',
  created_at   TIMESTAMP DEFAULT NOW()
);

--  Complaints (Student → Admin) 
CREATE TABLE complaints (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                    VARCHAR(200) NOT NULL,
  description              TEXT NOT NULL,
  category                 VARCHAR(100),
  priority                 complaint_priority DEFAULT 'medium',
  status                   complaint_status DEFAULT 'open',
  created_by               UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous             BOOLEAN DEFAULT FALSE,
  -- identity reveal fields
  identity_revealed        BOOLEAN DEFAULT FALSE,
  identity_revealed_by     UUID REFERENCES users(id),
  identity_revealed_reason TEXT,
  -- resolution
  resolved_at              TIMESTAMP,
  created_at               TIMESTAMP DEFAULT NOW(),
  updated_at               TIMESTAMP DEFAULT NOW()
);

--  Complaint Assignments 
-- Admin assigns a complaint to a teacher or faculty
CREATE TABLE complaint_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id    UUID REFERENCES complaints(id) ON DELETE CASCADE,
  assigned_to_type VARCHAR(10) CHECK (assigned_to_type IN ('teacher', 'faculty')),
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,    -- teacher user id (nullable)
  faculty_id      UUID REFERENCES faculties(id) ON DELETE SET NULL, -- or a faculty
  assigned_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  status          complaint_status DEFAULT 'assigned',
  remarks         TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

--  Teacher Responses on Complaints 
CREATE TABLE complaint_responses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  responder_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content      TEXT NOT NULL,
  new_status   complaint_status,
  created_at   TIMESTAMP DEFAULT NOW()
);

--  Notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       notif_type NOT NULL,
  message    TEXT NOT NULL,
  link       VARCHAR(200),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log 
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action       VARCHAR(100) NOT NULL,
  performed_by UUID REFERENCES users(id),
  target_user  UUID REFERENCES users(id),
  related_id   UUID,
  details      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Indexes 
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_users_faculty         ON users(faculty_id);
CREATE INDEX idx_community_posts_status ON community_posts(status);
CREATE INDEX idx_post_comments_post    ON post_comments(post_id);
CREATE INDEX idx_complaints_status     ON complaints(status);
CREATE INDEX idx_complaints_created_by ON complaints(created_by);
CREATE INDEX idx_assignments_complaint ON complaint_assignments(complaint_id);
CREATE INDEX idx_assignments_assigned  ON complaint_assignments(assigned_to);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);

-- Seed: Faculties 
INSERT INTO faculties (name, code) VALUES
  ('Civil Engineering', 'BCE'),
  ('Computer Engineering','BCT'),
  ('Electrical Engineering','BEL'),
  ('Electronics Engineering','BEX'),
  ('Mechanical Engineering','BME');

-- Seed: Users (passwords are all "password123") for testing purposes
-- bcrypt hash for "password123" with 10 rounds
INSERT INTO users (name, email, password_hash, role, faculty_id) VALUES
  ('Admin User',    'admin@college.edu.np',   '$2a$10$WZ65SxlO/HJoFlcQbsndTOIf3Qif2ak1Sq/t75Ex4xnNXmob0OryS', 'admin',   NULL),
  ('Prof. Sharma',  'sharma@college.edu.np',  '$2a$10$WZ65SxlO/HJoFlcQbsndTOIf3Qif2ak1Sq/t75Ex4xnNXmob0OryS', 'teacher', (SELECT id FROM faculties WHERE code='BCT')),
  ('Prof. Thapa',   'thapa@college.edu.np',   '$2a$10$WZ65SxlO/HJoFlcQbsndTOIf3Qif2ak1Sq/t75Ex4xnNXmob0OryS', 'teacher', (SELECT id FROM faculties WHERE code='BCE')),
  ('Student Demo',  'student@college.edu.np', '$2a$10$WZ65SxlO/HJoFlcQbsndTOIf3Qif2ak1Sq/t75Ex4xnNXmob0OryS', 'student', (SELECT id FROM faculties WHERE code='BCT'));

