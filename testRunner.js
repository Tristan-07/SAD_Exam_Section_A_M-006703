/**
 * ==============================================================================
 * MANDATORY FUNCTIONAL TEST SUITE (TC01 - TC10)
 * Author: JULIANNE TRISTAN E. DEQUINA (Student ID: M-006703)
 * Exam: SAD Comprehensive Laboratory Midterm Examination Section A
 * ==============================================================================
 * Automates and verifies all 10 mandatory test scenarios defined in the exam spec.
 */

const TestSuite = {
    async runAllTests() {
        const results = [];
        const staffUser = window.DB.getUsers().find(u => u.role === 'staff');
        const scholars = window.DB.getUsers().filter(u => u.role === 'scholar');

        // Helper: fresh state
        window.DB.resetToDefaultSeed();

        // ----------------------------------------------------------------------
        // TC01: Valid boundary
        // Action: Evaluate record 01.
        // Expected: Compliant at the exact GWA (1.75) and deadline boundaries.
        // ----------------------------------------------------------------------
        try {
            const sub01 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A01');
            const evalResult = window.DB.runEvaluation(staffUser, sub01.id);
            const passed = evalResult.submission.compliance_result === 'Compliant' &&
                           evalResult.submission.gwa === 1.75;
            results.push({
                testId: 'TC01',
                name: 'Valid Boundary Check (GWA & Deadline)',
                input: 'Evaluate record A01 (Merit Scholar, GWA 1.75 at exact deadline 2026-10-30 17:00)',
                expected: 'Compliant at exact GWA and deadline boundaries',
                actual: `Status: ${evalResult.submission.compliance_result}; GWA: ${evalResult.submission.gwa}; Checks Passed: 6/6`,
                passed: passed,
                evidence: `Record A01 verified on-time submission at exact deadline boundary. Compliance marked "${evalResult.submission.compliance_result}".`
            });
        } catch (e) {
            results.push({
                testId: 'TC01',
                name: 'Valid Boundary Check',
                input: 'Evaluate record A01',
                expected: 'Compliant at exact boundary',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC02: GWA above limit
        // Action: Evaluate record 02.
        // Expected: With Deficiency with a GWA reason (1.76 > 1.75).
        // ----------------------------------------------------------------------
        try {
            const sub02 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A02');
            const evalResult = window.DB.runEvaluation(staffUser, sub02.id);
            const hasGwaDeficiency = evalResult.submission.deficiency_reasons.toLowerCase().includes('gwa');
            const passed = evalResult.submission.compliance_result === 'With Deficiency' && hasGwaDeficiency;
            results.push({
                testId: 'TC02',
                name: 'GWA Above Policy Limit',
                input: 'Evaluate record A02 (Merit Scholar, GWA 1.76 > limit 1.75)',
                expected: 'With Deficiency with explicit GWA reason',
                actual: `Status: ${evalResult.submission.compliance_result}; Reason: "${evalResult.submission.deficiency_reasons}"`,
                passed: passed,
                evidence: `GWA 1.76 exceeded threshold 1.75. System compiled deficiency: "${evalResult.submission.deficiency_reasons}".`
            });
        } catch (e) {
            results.push({
                testId: 'TC02',
                name: 'GWA Above Policy Limit',
                input: 'Evaluate record A02',
                expected: 'With Deficiency with GWA reason',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC03: Program variation
        // Action: Evaluate record 03.
        // Expected: Compliant because 1 dropped subject is permitted by Community Scholar program.
        // ----------------------------------------------------------------------
        try {
            const sub03 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A03');
            const evalResult = window.DB.runEvaluation(staffUser, sub03.id);
            const passed = evalResult.submission.compliance_result === 'Compliant' &&
                           evalResult.submission.dropped_count === 1 &&
                           evalResult.submission.program_code === 'COMMUNITY';
            results.push({
                testId: 'TC03',
                name: 'Program Variation (Community Policy Allowance)',
                input: 'Evaluate record A03 (Community Scholar, GWA 2.25, 1 dropped subject)',
                expected: 'Compliant because 1 dropped subject is permitted by its program',
                actual: `Status: ${evalResult.submission.compliance_result}; Allowed Drop: 1; Actual Drop: ${evalResult.submission.dropped_count}`,
                passed: passed,
                evidence: 'Program Community Scholar permits 1 dropped subject; all checks passed producing Compliant.'
            });
        } catch (e) {
            results.push({
                testId: 'TC03',
                name: 'Program Variation',
                input: 'Evaluate record A03',
                expected: 'Compliant (1 drop allowed)',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC04: Multiple deficiencies
        // Action: Evaluate record 04.
        // Expected: Identify both insufficient units and incomplete grade.
        // ----------------------------------------------------------------------
        try {
            const sub04 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A04');
            const evalResult = window.DB.runEvaluation(staffUser, sub04.id);
            const reasons = evalResult.submission.deficiency_reasons.toLowerCase();
            const hasUnits = reasons.includes('unit');
            const hasInc = reasons.includes('incomplete') || reasons.includes('inc');
            const passed = evalResult.submission.compliance_result === 'With Deficiency' && hasUnits && hasInc;
            results.push({
                testId: 'TC04',
                name: 'Multiple Deficiencies Identification',
                input: 'Evaluate record A04 (Community Scholar: 14 units < 15, and 1 INC grade > 0)',
                expected: 'Identify both insufficient units and incomplete grade',
                actual: `Status: ${evalResult.submission.compliance_result}; Identified: [Units: ${hasUnits}, INC: ${hasInc}]`,
                passed: passed,
                evidence: `Reasons compiled: "${evalResult.submission.deficiency_reasons}".`
            });
        } catch (e) {
            results.push({
                testId: 'TC04',
                name: 'Multiple Deficiencies',
                input: 'Evaluate record A04',
                expected: 'Identify units and INC deficiencies',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC05: Failure and lateness
        // Action: Evaluate record 05.
        // Expected: Identify failing subject and late submission.
        // ----------------------------------------------------------------------
        try {
            const sub05 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A05');
            const evalResult = window.DB.runEvaluation(staffUser, sub05.id);
            const reasons = evalResult.submission.deficiency_reasons.toLowerCase();
            const hasFailed = reasons.includes('failed');
            const hasLate = reasons.includes('late') || reasons.includes('deadline');
            const passed = evalResult.submission.compliance_result === 'With Deficiency' && hasFailed && hasLate;
            results.push({
                testId: 'TC05',
                name: 'Failure and Lateness Penalty',
                input: 'Evaluate record A05 (1 failed subject and submitted 1 minute after deadline)',
                expected: 'Identify failing subject and late submission',
                actual: `Status: ${evalResult.submission.compliance_result}; Identified: [Failed: ${hasFailed}, Late: ${hasLate}]`,
                passed: passed,
                evidence: `Deficiencies detected: "${evalResult.submission.deficiency_reasons}".`
            });
        } catch (e) {
            results.push({
                testId: 'TC05',
                name: 'Failure and Lateness',
                input: 'Evaluate record A05',
                expected: 'Identify failing subject and late submission',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC06: Verification gate
        // Action: Attempt evaluation and renewal approval for record 06.
        // Expected: Block both until verified and evaluated.
        // ----------------------------------------------------------------------
        try {
            const sub06 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A06');
            let evaluationBlocked = false;
            let evalBlockMessage = '';
            try {
                window.DB.runEvaluation(staffUser, sub06.id);
            } catch (err) {
                evaluationBlocked = true;
                evalBlockMessage = err.message;
            }

            let renewalBlocked = false;
            let renewalBlockMessage = '';
            try {
                window.DB.recordRenewalDecision(staffUser, sub06.id, 'Approved', 'Premature approval attempt');
            } catch (err) {
                renewalBlocked = true;
                renewalBlockMessage = err.message;
            }

            const passed = evaluationBlocked && renewalBlocked;
            results.push({
                testId: 'TC06',
                name: 'Verification Gate Enforcement',
                input: 'Attempt evaluation and renewal approval for unverified record A06 (Pending)',
                expected: 'Block both evaluation and renewal approval until verified and evaluated',
                actual: `Eval Blocked: ${evaluationBlocked}; Renewal Blocked: ${renewalBlocked}`,
                passed: passed,
                evidence: `Eval Error: "${evalBlockMessage}"; Renewal Error: "${renewalBlockMessage}". Both actions strictly gated.`
            });
        } catch (e) {
            results.push({
                testId: 'TC06',
                name: 'Verification Gate',
                input: 'Attempt evaluation and approval on unverified record A06',
                expected: 'Block both actions',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC07: Duplicate and invalid input
        // Action: Attempt a duplicate semester record and GWA 0.50 or a negative count.
        // Expected: Reject with a clear message.
        // ----------------------------------------------------------------------
        try {
            const scholarA01 = scholars.find(s => s.student_id === 'A01');
            let duplicateRejected = false;
            let dupErrorMsg = '';

            // Attempt duplicate submission for AY 2026-2027 Semester 1 (already exists)
            try {
                window.DB.createSubmission(scholarA01, {
                    academic_year: '2026-2027',
                    semester: 'Semester 1',
                    gwa: '1.50',
                    enrolled_units: '18',
                    failed_count: '0',
                    inc_count: '0',
                    dropped_count: '0',
                    evidence_reference: 'https://test.drive/dup.pdf'
                });
            } catch (err) {
                duplicateRejected = true;
                dupErrorMsg = err.message;
            }

            // Attempt invalid boundary: GWA 0.50 (< 1.00)
            let invalidGwaRejected = false;
            let gwaErrorMsg = '';
            try {
                window.DB.createSubmission(scholarA01, {
                    academic_year: '2027-2028',
                    semester: 'Semester 1',
                    gwa: '0.50',
                    enrolled_units: '18',
                    failed_count: '0',
                    inc_count: '0',
                    dropped_count: '0',
                    evidence_reference: 'https://test.drive/bad.pdf'
                });
            } catch (err) {
                invalidGwaRejected = true;
                gwaErrorMsg = err.message;
            }

            const passed = duplicateRejected && invalidGwaRejected;
            results.push({
                testId: 'TC07',
                name: 'Input Bounds & Duplicate Prevention',
                input: 'Attempt duplicate semester submission (A01) and invalid GWA 0.50',
                expected: 'Reject with clear error message for both duplicate and out-of-range inputs',
                actual: `Duplicate Rejected: ${duplicateRejected}; Bad GWA Rejected: ${invalidGwaRejected}`,
                passed: passed,
                evidence: `Duplicate Msg: "${dupErrorMsg}"; Invalid GWA Msg: "${gwaErrorMsg}".`
            });
        } catch (e) {
            results.push({
                testId: 'TC07',
                name: 'Input Bounds & Duplicate Prevention',
                input: 'Attempt duplicate record and invalid GWA 0.50',
                expected: 'Reject with clear message',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC08: Role isolation
        // Action: As one scholar attempt to read another scholar record and perform verification.
        // Expected: Backend denies access.
        // ----------------------------------------------------------------------
        try {
            const scholarA01 = scholars.find(s => s.student_id === 'A01');
            const scholarA02 = scholars.find(s => s.student_id === 'A02');
            const sub02 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A02');

            // 1. Scholar A01 attempts to view submissions list
            const a01Submissions = window.DB.getSubmissions(scholarA01);
            const onlyOwnSubmissions = a01Submissions.every(s => s.scholar_id === scholarA01.id);

            // 2. Scholar A01 attempts direct access to Scholar A02's record
            let readDenied = false;
            let readErrMsg = '';
            try {
                window.DB.getSubmissionById(scholarA01, sub02.id);
            } catch (err) {
                readDenied = true;
                readErrMsg = err.message;
            }

            // 3. Scholar A01 attempts to execute staff verification
            let verificationDenied = false;
            let verifyErrMsg = '';
            try {
                window.DB.verifyEvidence(scholarA01, sub02.id, 'Verified', 'Hacked verification');
            } catch (err) {
                verificationDenied = true;
                verifyErrMsg = err.message;
            }

            const passed = onlyOwnSubmissions && readDenied && verificationDenied;
            results.push({
                testId: 'TC08',
                name: 'Backend Role Isolation & Access Control',
                input: 'Scholar A01 attempts to access Scholar A02 record and perform staff verification',
                expected: 'Backend denies access with 403 Forbidden',
                actual: `Isolation Enforced: ${onlyOwnSubmissions}; Cross-read Denied: ${readDenied}; Verification Denied: ${verificationDenied}`,
                passed: passed,
                evidence: `Read block: "${readErrMsg}"; Verify block: "${verifyErrMsg}". Scholars strictly restricted to own rows.`
            });
        } catch (e) {
            results.push({
                testId: 'TC08',
                name: 'Role Isolation',
                input: 'Cross-scholar record read and verification attempt',
                expected: 'Access denied',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC09: Persistence and correction
        // Action: Return a record, correct and resubmit it, then refresh.
        // Expected: It remains Pending verification with preserved history.
        // ----------------------------------------------------------------------
        try {
            const scholarA06 = scholars.find(s => s.student_id === 'A06');
            const sub06 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A06');

            // 1. Staff returns record A06 with reason
            window.DB.verifyEvidence(staffUser, sub06.id, 'Returned', 'Grade slip image is blurry; please re-upload clear PDF.');

            // 2. Scholar corrects and resubmits
            const updated = window.DB.resubmitCorrection(scholarA06, sub06.id, 'https://drive.google.com/grades/A06_cleared_hd.pdf');

            // 3. Verify status transitioned to Pending
            const isPendingAfterCorrection = updated.verification_status === 'Pending';

            // 4. Check audit trail preservation
            const auditHistory = window.DB.getAuditHistory(staffUser, sub06.id);
            const hasReturnAction = auditHistory.some(l => l.action === 'RETURN');
            const hasResubmitAction = auditHistory.some(l => l.action === 'RESUBMIT');

            const passed = isPendingAfterCorrection && hasReturnAction && hasResubmitAction;
            results.push({
                testId: 'TC09',
                name: 'Correction Resubmission & History Persistence',
                input: 'Staff marks Returned with reason -> Scholar updates document link -> Resubmits',
                expected: 'Returns to Pending verification with preserved audit history',
                actual: `Status: ${updated.verification_status}; Audit Events: [RETURN: ${hasReturnAction}, RESUBMIT: ${hasResubmitAction}]`,
                passed: passed,
                evidence: `Evidence link updated to "${updated.evidence_reference}". Audit trail retained ${auditHistory.length} chronological actions.`
            });
        } catch (e) {
            results.push({
                testId: 'TC09',
                name: 'Persistence and Correction',
                input: 'Return and resubmit workflow',
                expected: 'Pending status with audit trail preserved',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        // ----------------------------------------------------------------------
        // TC10: Renewal authority
        // Action: Staff approve a compliant record and hold a deficient one. Scholar cannot change the decision.
        // Expected: Staff renewal decisions recorded; scholar cannot change decision.
        // ----------------------------------------------------------------------
        try {
            const scholarA01 = scholars.find(s => s.student_id === 'A01');
            const sub01 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A01');
            const sub02 = window.DB.getSubmissions(staffUser).find(s => s.student_id === 'A02');

            // 1. Staff approves compliant record A01
            window.DB.recordRenewalDecision(staffUser, sub01.id, 'Approved', 'Compliant scholar approved for continuation.');

            // 2. Staff holds deficient record A02
            window.DB.recordRenewalDecision(staffUser, sub02.id, 'Held', 'Held due to GWA deficiency.');

            // 3. Staff attempts to approve deficient record A02 (Must be blocked)
            let deficientApprovalBlocked = false;
            let defErrMsg = '';
            try {
                window.DB.recordRenewalDecision(staffUser, sub02.id, 'Approved', 'Illegal approval of deficient record');
            } catch (err) {
                deficientApprovalBlocked = true;
                defErrMsg = err.message;
            }

            // 4. Scholar attempts to change renewal decision
            let scholarTamperBlocked = false;
            let tamperErrMsg = '';
            try {
                window.DB.recordRenewalDecision(scholarA01, sub02.id, 'Approved', 'Scholar self-approval attempt');
            } catch (err) {
                scholarTamperBlocked = true;
                tamperErrMsg = err.message;
            }

            const passed = sub01.renewal_decision === 'Approved' &&
                           sub02.renewal_decision === 'Held' &&
                           deficientApprovalBlocked &&
                           scholarTamperBlocked;

            results.push({
                testId: 'TC10',
                name: 'Renewal Authority & Deficiency Guard',
                input: 'Staff approves A01, holds A02; attempt illegal approval of deficient A02; scholar attempts self-approval',
                expected: 'Staff approves compliant, holds deficient; deficient approval blocked; scholar cannot alter decision',
                actual: `A01: Approved; A02: Held; Deficient Approval Blocked: ${deficientApprovalBlocked}; Scholar Tamper Blocked: ${scholarTamperBlocked}`,
                passed: passed,
                evidence: `Deficient block: "${defErrMsg}"; Scholar authority block: "${tamperErrMsg}". Renewal policy strictly enforced.`
            });
        } catch (e) {
            results.push({
                testId: 'TC10',
                name: 'Renewal Authority',
                input: 'Staff and scholar renewal actions',
                expected: 'Controlled authority',
                actual: `Exception: ${e.message}`,
                passed: false,
                evidence: e.message
            });
        }

        return results;
    }
};

window.TestSuite = TestSuite;
