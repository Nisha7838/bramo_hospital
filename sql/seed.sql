-- brahmo_seed.sql
USE brahmo_db;

INSERT INTO organizations (id, name) VALUES
('supra', 'Supra Multi-Specialty Hospital');

INSERT INTO hierarchy_levels (id, org_id, level_number, level_name, department) VALUES
('HL-01',         'supra', 1,  'Hospital',           NULL),
('HL-03',         'supra', 3,  'Clinical Division',  NULL),
('HL-05-ORTHO',   'supra', 5,  'Orthopaedics Dept',  'ortho'),
('HL-05-MED',     'supra', 5,  'Medicine Dept',      'medicine'),
('HL-05-PAEDS',   'supra', 5,  'Paediatrics Dept',   'paediatrics'),
('HL-08-ORTHO',   'supra', 8,  'Ortho General',      'ortho'),
('HL-10-ORTHO',   'supra', 10, 'Ortho Ward',         'ortho'),
('HL-12-RAMAIAH', 'supra', 12, 'Patient: Ramaiah',   'ortho'),
('HL-12-AADHYA',  'supra', 12, 'Patient: Aadhya',    'paediatrics');

INSERT INTO users (id, org_id, name, role, department) VALUES
('U-SHARMA', 'supra', 'Dr. Sharma (HOD GP)',    'HOD',    'medicine'),
('U-VIKRAM',  'supra', 'Dr. Vikram (HOD Ortho)', 'HOD',    'ortho'),
('U-PRIYA',   'supra', 'Nurse Priya',            'VIEWER', 'ortho');

INSERT INTO patients (id, org_id, name, age, gender, conditions, notes) VALUES
('PAT-RAMAIAH', 'supra', 'Mr. Ramaiah', 68, 'M',
 '["Cardiac stent (2022)", "Dual antiplatelet therapy", "Knee pain (osteoarthritis)", "AF on anticoagulation"]',
 'Warfarin 5mg daily. Clopidogrel 75mg. STRICTLY no NSAIDs. Keeps asking for Ibuprofen.'),
('PAT-AADHYA', 'supra', 'Aadhya', 3, 'F',
 '["Penicillin allergy (anaphylaxis at 18 months)", "Recurrent ear infections"]',
 'Use azithromycin for any bacterial infection. Mother frequently requests amoxicillin - must refuse.');

INSERT INTO knowledge_nodes
(id, org_id, hierarchy_level_id, type, title, content, importance, status, department, zone, source, created_by)
VALUES
('N-G01','supra','HL-03','CONSTRAINT','Warfarin-NSAID Interaction',
 'CRITICAL: Never prescribe NSAIDs (ibuprofen, aspirin, diclofenac) to patients on Warfarin or other anticoagulants. Risk of life-threatening GI bleed. Alternative: Paracetamol for pain.',
 0.98,'ACTIVE',NULL,2,'SEED','U-SHARMA'),

('N-G02','supra','HL-03','CONSTRAINT','Penicillin Allergy Cross-Reactivity',
 'Patients with documented penicillin allergy: 10% cross-reactivity with 1st-gen cephalosporins, <2% with 3rd-gen. Use azithromycin as first-line alternative. Always check allergy band.',
 0.95,'ACTIVE',NULL,2,'SEED','U-SHARMA'),

('N-G03','supra','HL-03','ANTI_PATTERN','Verbal Orders Without Documentation',
 'NEVER accept verbal orders for medication changes without written confirmation within 1 hour. Exception: cardiac arrest only.',
 0.90,'ACTIVE',NULL,2,'SEED','U-SHARMA'),

('N-O01','supra','HL-05-ORTHO','DECISION','Paracetamol First-Line Post-TKR',
 'Supra Ortho uses Paracetamol 650mg QDS as first-line post-TKR pain management. Escalation: Tramadol 50mg if VAS > 6. AVOID NSAIDs.',
 0.88,'ACTIVE','ortho',1,'SEED','U-VIKRAM'),

('N-O02','supra','HL-05-ORTHO','CONSTRAINT','DVT Prophylaxis Protocol',
 'ALL ortho surgical patients: Enoxaparin 40mg SC daily starting 12 hours post-op. 14 days TKR, 28 days THR.',
 0.93,'ACTIVE','ortho',1,'SEED','U-VIKRAM'),

('N-O03','supra','HL-05-ORTHO','ANTI_PATTERN','Never Discharge TKR Under 48 Hours',
 'Do NOT discharge TKR patients before 48 hours post-op. Past incident: DVT at home after 36-hour discharge.',
 0.91,'ACTIVE','ortho',1,'SEED','U-VIKRAM'),

('N-045','supra','HL-12-RAMAIAH','CONSTRAINT','Ramaiah: Absolute NSAID Contraindication',
 'ABSOLUTE CONTRAINDICATION: No ibuprofen, no aspirin, no diclofenac for patient Ramaiah. Cardiac stent (2022) + dual antiplatelet therapy. Previous 8 NSAID refusals documented. Use Paracetamol ONLY.',
 0.99,'ACTIVE','ortho',1,'CAPTURE','U-SHARMA'),

('N-046','supra','HL-12-RAMAIAH','FACT','Ramaiah: Medication Profile',
 'Ramaiah 68M. Warfarin 5mg daily (AF). Clopidogrel 75mg daily (post-stent). Paracetamol 650mg QDS (knee pain). Atorvastatin 40mg HS. INR target 2.0-3.0.',
 0.85,'ACTIVE','ortho',1,'SEED','U-VIKRAM'),

('N-047','supra','HL-12-RAMAIAH','DECISION','Ramaiah: Pain Management Strategy',
 'Current strategy: Paracetamol 650mg QDS + topical Diclofenac gel (minimal systemic absorption). If insufficient: consider intra-articular injection. NO oral NSAIDs.',
 0.82,'ACTIVE','ortho',1,'CAPTURE','U-SHARMA'),

('N-089','supra','HL-12-RAMAIAH','FACT','Ramaiah: Behavioral Note - NSAID Requests',
 'Patient Ramaiah repeatedly requests Ibuprofen for knee pain despite 7 documented refusals. Family (son) also requests. Counseled: NSAIDs contraindicated due to stent + anticoagulation. Last request: visit #23.',
 0.72,'ACTIVE','ortho',1,'CAPTURE','U-SHARMA'),

('N-060','supra','HL-12-AADHYA','CONSTRAINT','Aadhya: Penicillin Allergy',
 'Aadhya 3.5F. Documented penicillin allergy: anaphylaxis at 18 months (amoxicillin for otitis media). Azithromycin as alternative. NEVER prescribe penicillin-class antibiotics.',
 0.99,'ACTIVE','paediatrics',1,'SEED','U-SHARMA'),

('N-061','supra','HL-12-AADHYA','FACT','Aadhya: Infection History',
 'Aadhya: 4 ear infections in 12 months. Last: azithromycin 10mg/kg x 3 days. Mother frequently asks for amoxicillin. Always refuse with explanation.',
 0.75,'ACTIVE','paediatrics',1,'CAPTURE','U-SHARMA'),

('N-M01','supra','HL-05-MED','DECISION','Sepsis Protocol v3',
 'Sepsis Bundle v3 (2026): cultures before antibiotics, lactate within 1 HOUR, 30mL/kg crystalloid, vasopressors if MAP <65.',
 0.95,'ACTIVE','medicine',1,'SEED','U-SHARMA'),

('N-M02','supra','HL-05-MED','CONSTRAINT','Diabetic Fasting Protocol',
 'Fasting diabetic patients: adjust insulin timing not dose. Skip Glimepiride on fast days. BG q4h. Break fast if BG < 70.',
 0.90,'ACTIVE','medicine',1,'SEED','U-SHARMA'),

('N-D01','supra','HL-05-ORTHO','FACT','What is Osteoarthritis',
 'Osteoarthritis is a degenerative joint disease characterized by cartilage breakdown, pain, and stiffness. Most common form of arthritis.',
 0.35,'ACTIVE','ortho',1,'SEED','U-VIKRAM'),

('N-D02','supra','HL-05-MED','FACT','Tramadol Mechanism of Action',
 'Tramadol is a centrally acting synthetic opioid analgesic. Binds to mu-opioid receptors. Also inhibits serotonin and norepinephrine reuptake.',
 0.30,'ACTIVE','medicine',1,'SEED','U-SHARMA'),

('N-070','supra','HL-08-ORTHO','DECISION','Post-Surgical Pain Escalation Ladder',
 'Pain escalation: Step 1 Paracetamol 650mg QDS -> Step 2 Tramadol 50mg TDS -> Step 3 Morphine 5mg PRN. Skip Step 2 for elderly >75 (fall risk).',
 0.80,'ACTIVE','ortho',1,'SEED','U-VIKRAM'),

('N-071','supra','HL-05-ORTHO','FACT','Supra Ortho Implant Preferences',
 'Zimmer Biomet preferred for TKR. Smith & Nephew for revision cases. Decision based on 3-year outcomes review.',
 0.72,'ACTIVE','ortho',1,'SEED','U-VIKRAM'),

('N-072','supra','HL-03','CONSTRAINT','Fall Risk Assessment on Admission',
 'Every patient assessed for fall risk using Morse Fall Scale on admission. Score >= 45: high risk, bed alarm required.',
 0.85,'ACTIVE',NULL,2,'SEED','U-SHARMA'),

('N-073','supra','HL-03','CONSTRAINT','Antibiotic Stewardship 72-Hour Review',
 'All empiric antibiotics reviewed at 72 hours. De-escalate based on cultures. Pharmacy auto-alerts.',
 0.88,'ACTIVE',NULL,2,'SEED','U-SHARMA');
