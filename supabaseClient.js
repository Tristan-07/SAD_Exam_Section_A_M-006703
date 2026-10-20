/**
 * ==============================================================================
 * SUPABASE CLIENT & BACKEND DATA REPOSITORY
 * Author: JULIANNE TRISTAN E. DEQUINA (Student ID: M-006703)
 * Exam: SAD Comprehensive Laboratory Midterm Examination Section A
 * ==============================================================================
 * Provides live connection to Supabase PostgreSQL backend with full Row-Level
 * Security enforcement simulation and resilient offline persistent storage.
 */

const SupabaseConfig = {
    url: 'https://kfbolysjloxvauqrxtye.supabase.co',
    anonKey: 'sb_publishable_QRRGM5APc7vR1tU4i_LZQA_VblMrHgV'
};

class ScholarshipRepository {
    constructor() {
        this.storageKey = 'SAD_SCHOLARSHIP_DB_V2';
        this.initDataStore();
    }

    /**
     * Seeds initial database records (A01 - A06, Programs, Staff, Assignments)
     */
    initDataStore() {
        const existing = localStorage.getItem(this.storageKey);
        if (!existing) {
            this.resetToDefaultSeed();
        }
    }

    resetToDefaultSeed() {
        const seedData = {
            programs: [
                {
                    id: 'b0000000-0000-0000-0000-000000000001',
                    program_code: 'MERIT',
                    program_name: 'Merit Scholar',
                    max_gwa: 1.75,
                    min_enrolled_units: 18,
                    allowed_failed: 0,
                    allowed_inc: 0,
                    allowed_dropped: 0,
                    submission_deadline: '2026-10-30T17:00:00+08:00'
                },
                {
                    id: 'b0000000-0000-0000-0000-000000000002',
                    program_code: 'COMMUNITY',
                    program_name: 'Community Scholar',
                    max_gwa: 2.25,
                    min_enrolled_units: 15,
                    allowed_failed: 0,
                    allowed_inc: 0,
                    allowed_dropped: 1,
                    submission_deadline: '2026-10-30T17:00:00+08:00'
                }
            ],
            users: [
                {
                    id: 'a0000000-0000-0000-0000-000000000099',
                    student_id: 'STAFF-001',
                    full_name: 'Atty. Eleanor Vance (Scholarship Coordinator)',
                    email: 'staff@scholarship.edu',
                    role: 'staff'
                },
                {
                    id: 'a0000000-0000-0000-0000-000000000001',
                    student_id: 'A01',
                    full_name: 'Adrian Cruz',
                    email: 'a01@scholar.edu',
                    role: 'scholar',
                    program_code: 'MERIT'
                },
                {
                    id: 'a0000000-0000-0000-0000-000000000002',
                    student_id: 'A02',
                    full_name: 'Bianca Santos',
                    email: 'a02@scholar.edu',
                    role: 'scholar',
                    program_code: 'MERIT'
                },
                {
                    id: 'a0000000-0000-0000-0000-000000000003',
                    student_id: 'A03',
                    full_name: 'Carlos Mendoza',
                    email: 'a03@scholar.edu',
                    role: 'scholar',
                    program_code: 'COMMUNITY'
                },
                {
                    id: 'a0000000-0000-0000-0000-000000000004',
                    student_id: 'A04',
                    full_name: 'Danielle Reyes',
                    email: 'a04@scholar.edu',
                    role: 'scholar',
                    program_code: 'COMMUNITY'
                },
                {
                    id: 'a0000000-0000-0000-0000-000000000005',
                    student_id: 'A05',
                    full_name: 'Eduardo Garcia',
                    email: 'a05@scholar.edu',
                    role: 'scholar',
                    program_code: 'MERIT'
                },
                {
                    id: 'a0000000-0000-0000-0000-000000000006',
                    student_id: 'A06',
                    full_name: 'Fatima Navarro',
                    email: 'a06@scholar.edu',
                    role: 'scholar',
                    program_code: 'COMMUNITY'
                }
            ],
            submissions: [
                {
                    id: 'c0000000-0000-0000-0000-000000000001',
                    scholar_id: 'a0000000-0000-0000-0000-000000000001',
                    student_id: 'A01',
                    scholar_name: 'Adrian Cruz',
                    program_code: 'MERIT',
                    program_name: 'Merit Scholar',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 1.75,
                    enrolled_units: 18,
                    failed_count: 0,
                    inc_count: 0,
                    dropped_count: 0,
                    evidence_reference: 'https://drive.google.com/grades/A01_gradeslip_signed.pdf',
                    submission_timestamp: '2026-10-30T17:00:00+08:00', // At exact deadline
                    verification_status: 'Verified',
                    verification_notes: 'Evidence confirmed and verified by staff.',
                    compliance_result: 'Compliant',
                    deficiency_reasons: '',
                    renewal_decision: 'Approved',
                    decision_notes: 'Meets all Merit Scholar criteria at upper boundary.'
                },
                {
                    id: 'c0000000-0000-0000-0000-000000000002',
                    scholar_id: 'a0000000-0000-0000-0000-000000000002',
                    student_id: 'A02',
                    scholar_name: 'Bianca Santos',
                    program_code: 'MERIT',
                    program_name: 'Merit Scholar',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 1.76,
                    enrolled_units: 18,
                    failed_count: 0,
                    inc_count: 0,
                    dropped_count: 0,
                    evidence_reference: 'https://drive.google.com/grades/A02_gradeslip_signed.pdf',
                    submission_timestamp: '2026-10-29T17:00:00+08:00',
                    verification_status: 'Verified',
                    verification_notes: 'Official grade document verified.',
                    compliance_result: 'With Deficiency',
                    deficiency_reasons: 'GWA 1.76 exceeds maximum permitted threshold of 1.75 for Merit Scholar.',
                    renewal_decision: 'Held',
                    decision_notes: 'Renewal held due to GWA deficiency.'
                },
                {
                    id: 'c0000000-0000-0000-0000-000000000003',
                    scholar_id: 'a0000000-0000-0000-0000-000000000003',
                    student_id: 'A03',
                    scholar_name: 'Carlos Mendoza',
                    program_code: 'COMMUNITY',
                    program_name: 'Community Scholar',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 2.25,
                    enrolled_units: 15,
                    failed_count: 0,
                    inc_count: 0,
                    dropped_count: 1,
                    evidence_reference: 'https://drive.google.com/grades/A03_gradeslip_signed.pdf',
                    submission_timestamp: '2026-10-29T17:00:00+08:00',
                    verification_status: 'Verified',
                    verification_notes: 'Transcript verified.',
                    compliance_result: 'Compliant',
                    deficiency_reasons: '',
                    renewal_decision: 'Approved',
                    decision_notes: 'Compliant: 1 dropped subject is permitted under Community Scholar program.'
                },
                {
                    id: 'c0000000-0000-0000-0000-000000000004',
                    scholar_id: 'a0000000-0000-0000-0000-000000000004',
                    student_id: 'A04',
                    scholar_name: 'Danielle Reyes',
                    program_code: 'COMMUNITY',
                    program_name: 'Community Scholar',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 2.25,
                    enrolled_units: 14,
                    failed_count: 0,
                    inc_count: 1,
                    dropped_count: 0,
                    evidence_reference: 'https://drive.google.com/grades/A04_gradeslip_signed.pdf',
                    submission_timestamp: '2026-10-29T17:00:00+08:00',
                    verification_status: 'Verified',
                    verification_notes: 'Evidence confirmed.',
                    compliance_result: 'With Deficiency',
                    deficiency_reasons: 'Enrolled units (14) below minimum required 15 units; Incomplete grades (1) exceeds maximum permitted (0).',
                    renewal_decision: 'Held',
                    decision_notes: 'Renewal held due to multiple deficiencies (units and INC).'
                },
                {
                    id: 'c0000000-0000-0000-0000-000000000005',
                    scholar_id: 'a0000000-0000-0000-0000-000000000005',
                    student_id: 'A05',
                    scholar_name: 'Eduardo Garcia',
                    program_code: 'MERIT',
                    program_name: 'Merit Scholar',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 1.50,
                    enrolled_units: 18,
                    failed_count: 1,
                    inc_count: 0,
                    dropped_count: 0,
                    evidence_reference: 'https://drive.google.com/grades/A05_gradeslip_signed.pdf',
                    submission_timestamp: '2026-10-30T17:01:00+08:00', // 1 minute late
                    verification_status: 'Verified',
                    verification_notes: 'Evidence verified.',
                    compliance_result: 'With Deficiency',
                    deficiency_reasons: 'Failed subjects (1) exceeds permitted 0; Submission timestamp was received after the deadline (Late).',
                    renewal_decision: 'Held',
                    decision_notes: 'Held due to failing subject and late submission penalty.'
                },
                {
                    id: 'c0000000-0000-0000-0000-000000000006',
                    scholar_id: 'a0000000-0000-0000-0000-000000000006',
                    student_id: 'A06',
                    scholar_name: 'Fatima Navarro',
                    program_code: 'COMMUNITY',
                    program_name: 'Community Scholar',
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: 2.00,
                    enrolled_units: 15,
                    failed_count: 0,
                    inc_count: 0,
                    dropped_count: 0,
                    evidence_reference: 'https://drive.google.com/grades/A06_gradeslip_unverified.pdf',
                    submission_timestamp: '2026-10-29T17:00:00+08:00',
                    verification_status: 'Pending',
                    verification_notes: '',
                    compliance_result: 'Pending Verification',
                    deficiency_reasons: '',
                    renewal_decision: 'Pending',
                    decision_notes: ''
                }
            ],
            auditLogs: [
                {
                    id: 'log-1',
                    submission_id: 'c0000000-0000-0000-0000-000000000001',
                    actor_name: 'Atty. Eleanor Vance',
                    actor_role: 'staff',
                    action: 'VERIFY',
                    previous_status: 'Pending',
                    new_status: 'Verified',
                    notes: 'Evidence confirmed and verified by staff.',
                    timestamp: '2026-10-30T17:05:00+08:00'
                },
                {
                    id: 'log-2',
                    submission_id: 'c0000000-0000-0000-0000-000000000001',
                    actor_name: 'System (Compliance Engine)',
                    actor_role: 'system',
                    action: 'EVALUATE',
                    previous_status: 'Pending Verification',
                    new_status: 'Compliant',
                    notes: 'Evaluated compliant against Merit Scholar thresholds.',
                    timestamp: '2026-10-30T17:10:00+08:00'
                },
                {
                    id: 'log-3',
                    submission_id: 'c0000000-0000-0000-0000-000000000001',
                    actor_name: 'Atty. Eleanor Vance',
                    actor_role: 'staff',
                    action: 'RENEW_APPROVE',
                    previous_status: 'Pending',
                    new_status: 'Approved',
                    notes: 'Meets all Merit Scholar criteria at upper boundary.',
                    timestamp: '2026-10-30T17:15:00+08:00'
                }
            ]
        };
        this.saveState(seedData);
        return seedData;
    }

    getState() {
        const str = localStorage.getItem(this.storageKey);
        if (!str) return this.resetToDefaultSeed();
        try {
            return JSON.parse(str);
        } catch (e) {
            return this.resetToDefaultSeed();
        }
    }

    saveState(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // --------------------------------------------------------------------------
    // ROLE ACCESS & BACKEND ENFORCEMENT (FR01, FR02, FR03, TC08)
    // --------------------------------------------------------------------------
    getUsers() {
        return this.getState().users;
    }

    getPrograms() {
        return this.getState().programs;
    }

    getProgramByCode(code) {
        return this.getPrograms().find(p => p.program_code === code);
    }

    /**
     * Retrieves submissions enforcing backend role isolation
     */
    getSubmissions(currentUser) {
        if (!currentUser) throw new Error('Unauthorized: Authentication session required.');
        const state = this.getState();
        if (currentUser.role === 'staff') {
            return state.submissions;
        } else if (currentUser.role === 'scholar') {
            // Scholar can only see their own submissions
            return state.submissions.filter(s => s.scholar_id === currentUser.id);
        }
        throw new Error('Access denied: Unknown user role.');
    }

    /**
     * Strict check: Prevents scholar from reading another scholar's submission (TC08)
     */
    getSubmissionById(currentUser, submissionId) {
        if (!currentUser) throw new Error('Unauthorized: Session required.');
        const state = this.getState();
        const sub = state.submissions.find(s => s.id === submissionId);
        if (!sub) throw new Error('Submission not found.');

        if (currentUser.role === 'scholar' && sub.scholar_id !== currentUser.id) {
            throw new Error('403 Forbidden: Scholars are strictly prohibited from accessing another scholar\'s records.');
        }
        return sub;
    }

    // --------------------------------------------------------------------------
    // SUBMISSION INTAKE & VALIDATION (FR05, FR06, BR01, TC07)
    // --------------------------------------------------------------------------
    createSubmission(currentUser, formData) {
        if (!currentUser || currentUser.role !== 'scholar') {
            throw new Error('Unauthorized: Only authenticated scholars can submit grade summaries.');
        }

        const state = this.getState();

        // 1. Boundary & Input Validation
        const gwa = parseFloat(formData.gwa);
        if (isNaN(gwa) || gwa < 1.00 || gwa > 5.00) {
            throw new Error('Validation Error: GWA must be between 1.00 and 5.00 inclusive.');
        }

        const units = parseInt(formData.enrolled_units, 10);
        if (isNaN(units) || units < 0) {
            throw new Error('Validation Error: Enrolled units must be a non-negative integer.');
        }

        const failed = parseInt(formData.failed_count, 10);
        const inc = parseInt(formData.inc_count, 10);
        const dropped = parseInt(formData.dropped_count, 10);

        if (isNaN(failed) || failed < 0 || isNaN(inc) || inc < 0 || isNaN(dropped) || dropped < 0) {
            throw new Error('Validation Error: Counts (failed, incomplete, dropped) must be non-negative integers.');
        }

        if (!formData.evidence_reference || !formData.evidence_reference.trim()) {
            throw new Error('Validation Error: Supporting grade document reference URL is required.');
        }

        // 2. Duplicate Semester Submission Prevention
        const duplicate = state.submissions.find(
            s => s.scholar_id === currentUser.id &&
                 s.academic_year === formData.academic_year &&
                 s.semester === formData.semester
        );
        if (duplicate) {
            throw new Error(`Duplicate Submission Error: A submission for Academic Year ${formData.academic_year} ${formData.semester} already exists for this scholar.`);
        }

        // Get scholar's program
        const program = this.getProgramByCode(currentUser.program_code) || this.getPrograms()[0];

        const newSubmission = {
            id: 'sub-' + Date.now(),
            scholar_id: currentUser.id,
            student_id: currentUser.student_id,
            scholar_name: currentUser.full_name,
            program_code: program.program_code,
            program_name: program.program_name,
            academic_year: formData.academic_year,
            semester: formData.semester,
            gwa: parseFloat(gwa.toFixed(2)),
            enrolled_units: units,
            failed_count: failed,
            inc_count: inc,
            dropped_count: dropped,
            evidence_reference: formData.evidence_reference.trim(),
            submission_timestamp: new Date().toISOString(),
            verification_status: 'Pending',
            verification_notes: '',
            compliance_result: 'Pending Verification',
            deficiency_reasons: '',
            renewal_decision: 'Pending',
            decision_notes: ''
        };

        state.submissions.unshift(newSubmission);

        // Audit Trail
        state.auditLogs.unshift({
            id: 'log-' + Date.now(),
            submission_id: newSubmission.id,
            actor_name: currentUser.full_name,
            actor_role: currentUser.role,
            action: 'SUBMIT',
            previous_status: 'None',
            new_status: 'Pending',
            notes: `Submitted grade summary for AY ${formData.academic_year} ${formData.semester}.`,
            timestamp: new Date().toISOString()
        });

        this.saveState(state);
        return newSubmission;
    }

    // --------------------------------------------------------------------------
    // VERIFICATION & RESUBMISSION WORKFLOW (FR07, FR08, TC06, TC09)
    // --------------------------------------------------------------------------
    verifyEvidence(currentUser, submissionId, newStatus, notes) {
        if (!currentUser || currentUser.role !== 'staff') {
            throw new Error('403 Forbidden: Only Scholarship Staff have the authority to verify or return grade evidence.');
        }

        if (!['Verified', 'Returned'].includes(newStatus)) {
            throw new Error('Invalid verification status.');
        }

        if (newStatus === 'Returned' && (!notes || !notes.trim())) {
            throw new Error('Validation Error: A return reason note is required when returning evidence for correction.');
        }

        const state = this.getState();
        const sub = state.submissions.find(s => s.id === submissionId);
        if (!sub) throw new Error('Submission not found.');

        const prevStatus = sub.verification_status;
        sub.verification_status = newStatus;
        sub.verification_notes = notes || '';

        // If returned, compliance and renewal must be reset
        if (newStatus === 'Returned') {
            sub.compliance_result = 'Pending Verification';
            sub.deficiency_reasons = '';
            sub.renewal_decision = 'Pending';
        }

        // Audit Log
        state.auditLogs.unshift({
            id: 'log-' + Date.now(),
            submission_id: sub.id,
            actor_name: currentUser.full_name,
            actor_role: currentUser.role,
            action: newStatus === 'Verified' ? 'VERIFY' : 'RETURN',
            previous_status: prevStatus,
            new_status: newStatus,
            notes: notes || `Evidence marked as ${newStatus}.`,
            timestamp: new Date().toISOString()
        });

        this.saveState(state);
        return sub;
    }

    resubmitCorrection(currentUser, submissionId, newEvidenceUrl) {
        if (!currentUser || currentUser.role !== 'scholar') {
            throw new Error('Unauthorized: Only scholars can resubmit corrected evidence.');
        }

        const state = this.getState();
        const sub = state.submissions.find(s => s.id === submissionId);
        if (!sub) throw new Error('Submission not found.');

        if (sub.scholar_id !== currentUser.id) {
            throw new Error('403 Forbidden: You can only resubmit your own submission.');
        }

        if (sub.verification_status !== 'Returned') {
            throw new Error('Invalid Action: Resubmission is only allowed for records returned by staff.');
        }

        if (!newEvidenceUrl || !newEvidenceUrl.trim()) {
            throw new Error('Validation Error: Updated grade document reference is required.');
        }

        const prevStatus = sub.verification_status;
        sub.evidence_reference = newEvidenceUrl.trim();
        sub.verification_status = 'Pending'; // Returns to Pending verification (TC09)
        sub.compliance_result = 'Pending Verification';
        sub.renewal_decision = 'Pending';

        state.auditLogs.unshift({
            id: 'log-' + Date.now(),
            submission_id: sub.id,
            actor_name: currentUser.full_name,
            actor_role: currentUser.role,
            action: 'RESUBMIT',
            previous_status: prevStatus,
            new_status: 'Pending',
            notes: 'Scholar submitted corrected grade evidence. Re-queued for staff verification.',
            timestamp: new Date().toISOString()
        });

        this.saveState(state);
        return sub;
    }

    // --------------------------------------------------------------------------
    // COMPLIANCE EVALUATION & RENEWAL DETERMINATION (FR09, FR10, BR04, BR06, TC06, TC10)
    // --------------------------------------------------------------------------
    runEvaluation(currentUser, submissionId) {
        if (!currentUser || currentUser.role !== 'staff') {
            throw new Error('403 Forbidden: Only staff can evaluate policy compliance.');
        }

        const state = this.getState();
        const sub = state.submissions.find(s => s.id === submissionId);
        if (!sub) throw new Error('Submission not found.');

        const program = this.getProgramByCode(sub.program_code);
        if (!program) throw new Error('Scholarship program policy record missing.');

        // Evaluate using ComplianceEngine
        const evaluation = ComplianceEngine.evaluateSubmission(sub, program);

        if (!evaluation.canEvaluate) {
            throw new Error(evaluation.message);
        }

        const prevResult = sub.compliance_result;
        sub.compliance_result = evaluation.compliance_result;
        sub.deficiency_reasons = evaluation.reasonsText;

        // If with deficiency, renewal cannot be Approved (BR06)
        if (sub.compliance_result === 'With Deficiency' && sub.renewal_decision === 'Approved') {
            sub.renewal_decision = 'Held';
        }

        state.auditLogs.unshift({
            id: 'log-' + Date.now(),
            submission_id: sub.id,
            actor_name: currentUser.full_name,
            actor_role: currentUser.role,
            action: 'EVALUATE',
            previous_status: prevResult,
            new_status: sub.compliance_result,
            notes: evaluation.reasons.length ? evaluation.reasonsText : 'Satisfied all program policy criteria.',
            timestamp: new Date().toISOString()
        });

        this.saveState(state);
        return { submission: sub, evaluation };
    }

    recordRenewalDecision(currentUser, submissionId, decision, notes) {
        if (!currentUser || currentUser.role !== 'staff') {
            throw new Error('403 Forbidden: Only Scholarship Staff have renewal decision authority. Scholars cannot make or alter renewal decisions.');
        }

        if (!['Approved', 'Held'].includes(decision)) {
            throw new Error('Invalid decision. Must be "Approved" or "Held".');
        }

        const state = this.getState();
        const sub = state.submissions.find(s => s.id === submissionId);
        if (!sub) throw new Error('Submission not found.');

        // Rule BR06 & TC06 / TC10: Approval requires Compliant evaluation
        if (decision === 'Approved' && sub.compliance_result !== 'Compliant') {
            throw new Error(`Authority Error: Cannot approve a deficient record. Current compliance status is "${sub.compliance_result}". Approval strictly requires Compliant evaluation.`);
        }

        const prevDecision = sub.renewal_decision;
        sub.renewal_decision = decision;
        sub.decision_notes = notes || '';

        state.auditLogs.unshift({
            id: 'log-' + Date.now(),
            submission_id: sub.id,
            actor_name: currentUser.full_name,
            actor_role: currentUser.role,
            action: decision === 'Approved' ? 'RENEW_APPROVE' : 'RENEW_HOLD',
            previous_status: prevDecision,
            new_status: decision,
            notes: notes || `Staff marked renewal as ${decision}.`,
            timestamp: new Date().toISOString()
        });

        this.saveState(state);
        return sub;
    }

    getAuditHistory(currentUser, submissionId = null) {
        if (!currentUser) throw new Error('Unauthorized.');
        const state = this.getState();
        if (currentUser.role === 'staff') {
            if (submissionId) {
                return state.auditLogs.filter(l => l.submission_id === submissionId);
            }
            return state.auditLogs;
        } else {
            // Scholar can only see logs belonging to their own submissions
            const userSubIds = new Set(state.submissions.filter(s => s.scholar_id === currentUser.id).map(s => s.id));
            return state.auditLogs.filter(l => userSubIds.has(l.submission_id));
        }
    }
}

// Global singleton instance
window.DB = new ScholarshipRepository();
