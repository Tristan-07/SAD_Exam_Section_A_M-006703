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

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

class ScholarshipRepository {
    constructor() {
        this.storageKey = 'SAD_SCHOLARSHIP_DB_V3';
        this.initDataStore();
        // Asynchronously sync from Supabase cloud database
        this.syncWithSupabase();
    }

    /**
     * Executes direct REST requests to Supabase PostgreSQL backend
     */
    async supabaseRequest(endpoint, method = 'GET', body = null) {
        try {
            const headers = {
                'apikey': SupabaseConfig.anonKey,
                'Authorization': `Bearer ${SupabaseConfig.anonKey}`,
                'Content-Type': 'application/json'
            };
            if (method === 'POST') {
                headers['Prefer'] = 'return=representation';
            }

            const options = { method, headers };
            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = JSON.stringify(body);
            }

            const res = await fetch(`${SupabaseConfig.url}/rest/v1/${endpoint}`, options);
            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                return { success: false, status: res.status, error: errData };
            }
            const data = await res.json().catch(() => null);
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Synchronizes users and submissions between Supabase Cloud and local cache
     */
    async syncWithSupabase() {
        try {
            // 1. Fetch remote users
            const uRes = await this.supabaseRequest('user_profiles?select=*');
            if (uRes.success && Array.isArray(uRes.data) && uRes.data.length > 0) {
                const state = this.getState();
                uRes.data.forEach(remUser => {
                    const found = state.users.find(u => u.id === remUser.id || u.student_id === remUser.student_id);
                    if (!found) {
                        state.users.push({
                            id: remUser.id,
                            student_id: remUser.student_id,
                            full_name: remUser.full_name,
                            email: remUser.email,
                            role: remUser.role,
                            program_code: remUser.role === 'scholar' ? 'MERIT' : null
                        });
                    }
                });
                this.saveState(state);
            }

            // 1b. Fetch assignments to enrich scholar program_code
            const aRes = await this.supabaseRequest('scholar_assignments?select=*');
            const pRes = await this.supabaseRequest('scholarship_programs?select=*');
            if (aRes.success && Array.isArray(aRes.data)) {
                const progMap = {};
                if (pRes.success && Array.isArray(pRes.data)) {
                    pRes.data.forEach(p => { progMap[p.id] = p.program_code; });
                }
                const state = this.getState();
                aRes.data.forEach(asgn => {
                    const u = state.users.find(usr => usr.id === asgn.scholar_id);
                    if (u && progMap[asgn.program_id]) {
                        u.program_code = progMap[asgn.program_id];
                    }
                });
                this.saveState(state);
            }

            // 2. Fetch remote submissions
            const sRes = await this.supabaseRequest('semester_submissions?select=*');
            if (sRes.success && Array.isArray(sRes.data) && sRes.data.length > 0) {
                const state = this.getState();
                sRes.data.forEach(remSub => {
                    const localIdx = state.submissions.findIndex(s => s.id === remSub.id);
                    const author = state.users.find(u => u.id === remSub.scholar_id);
                    const enriched = {
                        ...remSub,
                        student_id: author ? author.student_id : (remSub.student_id || 'UNKNOWN'),
                        scholar_name: author ? author.full_name : (remSub.scholar_name || 'Scholar'),
                        program_code: author ? (author.program_code || 'MERIT') : 'MERIT',
                        program_name: author && author.program_code === 'COMMUNITY' ? 'Community Scholar' : 'Merit Scholar'
                    };
                    if (localIdx === -1) {
                        state.submissions.unshift(enriched);
                    } else {
                        state.submissions[localIdx] = enriched;
                    }
                });
                this.saveState(state);
            }
        } catch (e) {
            console.warn('Background Supabase Sync error:', e);
        }
    }

    /**
     * Creates a new user account in Supabase user_profiles and local storage
     */
    async registerUser({ student_id, full_name, email, role, program_code, password }) {
        const state = this.getState();
        const idTrim = (student_id || '').trim();
        const emailTrim = (email || '').trim().toLowerCase();
        const nameTrim = (full_name || '').trim();

        if (!idTrim || !emailTrim || !nameTrim) {
            throw new Error('Please fill in all required registration fields.');
        }

        // Check uniqueness
        const existing = state.users.find(u => u.student_id.toLowerCase() === idTrim.toLowerCase() || u.email.toLowerCase() === emailTrim);
        if (existing) {
            throw new Error(`An account with ID "${idTrim}" or email "${emailTrim}" already exists.`);
        }

        const newUserId = generateUUID();
        const newUser = {
            id: newUserId,
            student_id: idTrim,
            full_name: nameTrim,
            email: emailTrim,
            role: role || 'scholar',
            program_code: role === 'scholar' ? (program_code || 'MERIT') : null,
            password: password || 'password123',
            created_at: new Date().toISOString()
        };

        // 1. Send to Supabase Cloud user_profiles
        try {
            const resp = await this.supabaseRequest('user_profiles', 'POST', {
                id: newUser.id,
                student_id: newUser.student_id,
                full_name: newUser.full_name,
                email: newUser.email,
                role: newUser.role
            });

            if (newUser.role === 'scholar') {
                const prog = this.getProgramByCode(newUser.program_code) || this.getPrograms()[0];
                if (prog) {
                    await this.supabaseRequest('scholar_assignments', 'POST', {
                        id: generateUUID(),
                        scholar_id: newUser.id,
                        program_id: prog.id,
                        award_status: 'Active'
                    });
                }
            }
            if (!resp.success) {
                console.warn('Supabase profile insertion note:', resp.error);
            }
        } catch (e) {
            console.warn('Supabase remote write error:', e);
        }

        // 2. Persist locally
        state.users.push(newUser);
        this.saveState(state);
        return newUser;
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
                }
            ],
            submissions: [],
            auditLogs: []
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

        const newSubId = generateUUID();
        const newLogId = generateUUID();

        const newSubmission = {
            id: newSubId,
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
        const newLog = {
            id: newLogId,
            submission_id: newSubmission.id,
            actor_name: currentUser.full_name,
            actor_role: currentUser.role,
            action: 'SUBMIT',
            previous_status: 'None',
            new_status: 'Pending',
            notes: `Submitted grade summary for AY ${formData.academic_year} ${formData.semester}.`,
            timestamp: new Date().toISOString()
        };
        state.auditLogs.unshift(newLog);

        this.saveState(state);

        // Asynchronously post to Supabase Cloud
        this.supabaseRequest('semester_submissions', 'POST', {
            id: newSubmission.id,
            scholar_id: currentUser.id,
            academic_year: newSubmission.academic_year,
            semester: newSubmission.semester,
            gwa: newSubmission.gwa,
            enrolled_units: newSubmission.enrolled_units,
            failed_count: newSubmission.failed_count,
            inc_count: newSubmission.inc_count,
            dropped_count: newSubmission.dropped_count,
            evidence_reference: newSubmission.evidence_reference,
            submission_timestamp: newSubmission.submission_timestamp,
            verification_status: newSubmission.verification_status,
            verification_notes: '',
            compliance_result: newSubmission.compliance_result,
            deficiency_reasons: '',
            renewal_decision: newSubmission.renewal_decision,
            decision_notes: ''
        }).then(res => {
            if (!res.success) console.warn('Supabase submission remote sync note:', res.error);
        }).catch(err => console.warn('Supabase sync network error:', err));

        this.supabaseRequest('decision_audit_history', 'POST', {
            id: newLog.id,
            submission_id: newSubmission.id,
            actor_id: currentUser.id,
            action: newLog.action,
            previous_status: newLog.previous_status,
            new_status: newLog.new_status,
            notes: newLog.notes
        }).catch(() => {});

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

        // Sync update to Supabase Cloud
        this.supabaseRequest(`semester_submissions?id=eq.${sub.id}`, 'PATCH', {
            verification_status: sub.verification_status,
            verification_notes: sub.verification_notes,
            compliance_result: sub.compliance_result,
            deficiency_reasons: sub.deficiency_reasons,
            renewal_decision: sub.renewal_decision,
            updated_at: new Date().toISOString()
        }).catch(err => console.warn('Supabase verify patch error:', err));

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

        // Sync resubmission to Supabase Cloud
        this.supabaseRequest(`semester_submissions?id=eq.${sub.id}`, 'PATCH', {
            evidence_reference: sub.evidence_reference,
            verification_status: sub.verification_status,
            compliance_result: sub.compliance_result,
            renewal_decision: sub.renewal_decision,
            updated_at: new Date().toISOString()
        }).catch(err => console.warn('Supabase resubmit patch error:', err));

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

        // Sync evaluation result to Supabase Cloud
        this.supabaseRequest(`semester_submissions?id=eq.${sub.id}`, 'PATCH', {
            compliance_result: sub.compliance_result,
            deficiency_reasons: sub.deficiency_reasons,
            renewal_decision: sub.renewal_decision,
            updated_at: new Date().toISOString()
        }).catch(err => console.warn('Supabase evaluate patch error:', err));

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

        // Sync renewal decision to Supabase Cloud
        this.supabaseRequest(`semester_submissions?id=eq.${sub.id}`, 'PATCH', {
            renewal_decision: sub.renewal_decision,
            decision_notes: sub.decision_notes,
            updated_at: new Date().toISOString()
        }).catch(err => console.warn('Supabase renewal patch error:', err));

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
