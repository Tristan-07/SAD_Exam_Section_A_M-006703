/**
 * ==============================================================================
 * COMPLIANCE & EVALUATION ENGINE
 * Author: JULIANNE TRISTAN E. DEQUINA (Student ID: M-006703)
 * Exam: SAD Comprehensive Laboratory Midterm Examination Section A
 * ==============================================================================
 * Evaluates verified semester submissions against dynamic, persisted scholarship
 * program policy thresholds in accordance with BR01, BR02, BR03, and BR04.
 */

const ComplianceEngine = {
    /**
     * Parses and normalizes any date into Asia/Manila (UTC+8) epoch milliseconds
     */
    parseToManilaTimestamp(dateString) {
        if (!dateString) return null;
        const d = new Date(dateString);
        return d.getTime();
    },

    /**
     * Checks if submission timestamp is on or before the deadline in Asia/Manila time
     */
    isSubmissionOnTime(submissionTimestamp, deadlineString) {
        if (!submissionTimestamp || !deadlineString) return true;
        const subTime = new Date(submissionTimestamp).getTime();
        const deadlineTime = new Date(deadlineString).getTime();
        // A submission at the exact deadline is on time; one after it is late.
        return subTime <= deadlineTime;
    },

    /**
     * Formats an ISO date into readable Asia/Manila string
     */
    formatDateManila(dateString) {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return d.toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }) + ' (PHT)';
    },

    /**
     * Core evaluation function
     * @param {Object} submission - The semester submission record
     * @param {Object} program - The persisted scholarship policy record
     * @returns {Object} Evaluation outcome: { canEvaluate, status, reasons, checks }
     */
    evaluateSubmission(submission, program) {
        if (!submission) {
            throw new Error('Submission record is required for evaluation.');
        }
        if (!program) {
            throw new Error('Scholarship program policy record is required.');
        }

        // Rule BR04 & TC06: Verification Gate
        // Missing or unverified evidence prevents final evaluation.
        if (submission.verification_status !== 'Verified') {
            return {
                canEvaluate: false,
                isGated: true,
                status: 'Pending Verification',
                message: `Evaluation blocked: Submission verification status is "${submission.verification_status}". Evidence must be marked "Verified" by staff before evaluation.`,
                reasons: [`Submission evidence is ${submission.verification_status}. Verification is required.`],
                checks: []
            };
        }

        const reasons = [];
        const checks = [];

        // Check 1: GWA Boundary
        // 1.00 is best, 5.00 failing. Smaller GWA is better.
        const gwaVal = parseFloat(submission.gwa);
        const maxGwa = parseFloat(program.max_gwa);
        const gwaPassed = gwaVal <= maxGwa;
        checks.push({
            rule: 'Maximum permitted GWA',
            threshold: `<= ${maxGwa.toFixed(2)}`,
            actual: gwaVal.toFixed(2),
            passed: gwaPassed,
            details: gwaPassed ? 'GWA within acceptable boundary' : `GWA ${gwaVal.toFixed(2)} exceeds maximum permitted ${maxGwa.toFixed(2)}`
        });
        if (!gwaPassed) {
            reasons.push(`GWA of ${gwaVal.toFixed(2)} exceeds maximum permitted threshold of ${maxGwa.toFixed(2)} for ${program.program_name}.`);
        }

        // Check 2: Minimum Enrolled Units
        const unitsVal = parseInt(submission.enrolled_units, 10);
        const minUnits = parseInt(program.min_enrolled_units, 10);
        const unitsPassed = unitsVal >= minUnits;
        checks.push({
            rule: 'Minimum enrolled units',
            threshold: `>= ${minUnits}`,
            actual: `${unitsVal} units`,
            passed: unitsPassed,
            details: unitsPassed ? 'Enrolled units requirement met' : `Enrolled units (${unitsVal}) below required ${minUnits}`
        });
        if (!unitsPassed) {
            reasons.push(`Enrolled units (${unitsVal}) is below the minimum required ${minUnits} units.`);
        }

        // Check 3: Allowed Failed Subjects
        const failedVal = parseInt(submission.failed_count, 10);
        const allowedFailed = parseInt(program.allowed_failed, 10);
        const failedPassed = failedVal <= allowedFailed;
        checks.push({
            rule: 'Allowed failed subjects',
            threshold: `<= ${allowedFailed}`,
            actual: `${failedVal}`,
            passed: failedPassed,
            details: failedPassed ? 'No unauthorized failed subjects' : `Failed subjects (${failedVal}) exceeds permitted ${allowedFailed}`
        });
        if (!failedPassed) {
            reasons.push(`Failed subjects (${failedVal}) exceeds maximum allowed (${allowedFailed}).`);
        }

        // Check 4: Allowed Incomplete (INC) Grades
        const incVal = parseInt(submission.inc_count, 10);
        const allowedInc = parseInt(program.allowed_inc, 10);
        const incPassed = incVal <= allowedInc;
        checks.push({
            rule: 'Allowed incomplete grades',
            threshold: `<= ${allowedInc}`,
            actual: `${incVal}`,
            passed: incPassed,
            details: incPassed ? 'No unauthorized incomplete grades' : `Incomplete grades (${incVal}) exceeds permitted ${allowedInc}`
        });
        if (!incPassed) {
            reasons.push(`Incomplete grades (${incVal}) exceeds maximum allowed (${allowedInc}).`);
        }

        // Check 5: Allowed Dropped Subjects
        const droppedVal = parseInt(submission.dropped_count, 10);
        const allowedDropped = parseInt(program.allowed_dropped, 10);
        const droppedPassed = droppedVal <= allowedDropped;
        checks.push({
            rule: 'Allowed dropped subjects',
            threshold: `<= ${allowedDropped}`,
            actual: `${droppedVal}`,
            passed: droppedPassed,
            details: droppedPassed ? 'Dropped subjects within allowance' : `Dropped subjects (${droppedVal}) exceeds permitted ${allowedDropped}`
        });
        if (!droppedPassed) {
            reasons.push(`Dropped subjects (${droppedVal}) exceeds maximum allowed (${allowedDropped}) for ${program.program_name}.`);
        }

        // Check 6: Submission Deadline (Asia/Manila time)
        const onTime = this.isSubmissionOnTime(submission.submission_timestamp, program.submission_deadline);
        checks.push({
            rule: 'Submission deadline (Asia/Manila)',
            threshold: program.submission_deadline,
            actual: submission.submission_timestamp,
            passed: onTime,
            details: onTime ? 'Submitted on or before deadline' : 'Submitted after deadline (Late submission)'
        });
        if (!onTime) {
            reasons.push(`Submission timestamp (${this.formatDateManila(submission.submission_timestamp)}) was received after the deadline (${this.formatDateManila(program.submission_deadline)}).`);
        }

        // Final Outcome Determination: All checks passing produces Compliant
        const isCompliant = checks.every(c => c.passed);

        return {
            canEvaluate: true,
            isGated: false,
            compliance_result: isCompliant ? 'Compliant' : 'With Deficiency',
            reasons: reasons,
            reasonsText: reasons.join('; '),
            checks: checks
        };
    },

    /**
     * Validates whether staff renewal decision is authorized based on compliance result
     * Rule: Staff cannot approve a deficient record; approval requires Compliant evaluation.
     */
    canApproveRenewal(complianceResult) {
        return complianceResult === 'Compliant';
    }
};

// Export for browser and test environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComplianceEngine;
}
