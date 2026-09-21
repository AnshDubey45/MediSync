-- MediSync Database Schema (Supabase PostgreSQL)

-- 1. Patients Table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cases Table
CREATE TYPE priority_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE case_status AS ENUM ('Waiting', 'Reviewing', 'Resolved');

CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    case_reference TEXT NOT NULL UNIQUE,
    symptoms TEXT NOT NULL,
    duration TEXT NOT NULL,
    score INTEGER NOT NULL,
    priority priority_level NOT NULL,
    status case_status NOT NULL DEFAULT 'Waiting',
    triage_factors JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for the cases table
ALTER PUBLICATION supabase_realtime ADD TABLE public.cases;

-- Enable Row Level Security (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for Intake (public facing)
CREATE POLICY "Allow public insert to patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to cases" ON public.cases FOR INSERT WITH CHECK (true);

-- Allow public read for cases (for the demo dashboard; in production, this should be auth-gated)
CREATE POLICY "Allow public read on cases" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Allow public read on patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow public update on cases" ON public.cases FOR UPDATE USING (true);
