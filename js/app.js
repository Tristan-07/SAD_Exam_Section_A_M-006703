/**
 * ==============================================================================
 * APPLICATION CONTROLLER & UI LOGIC
 * Author: JULIANNE TRISTAN E. DEQUINA (Student ID: M-006703)
 * Exam: SAD Comprehensive Laboratory Midterm Examination Section A
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    currentUser: null,
    currentLoginRole: 'scholar',
    selectedSubmissionForAction: null,

    async init() {
        this.populateUserSelect();
        this.bindEvents();
        this.renderPolicies();

        // Sync real users and submissions from Supabase Cloud
        try {
            await window.DB.syncWithSupabase();
            this.populateUserSelect();
        } catch (e) {
            console.warn('Initial Supabase sync note:', e);
        }

        // Restore active authenticated session if page was refreshed
        const savedUserId = sessionStorage.getItem('SAD_AUTH_USER_ID');
        if (savedUserId) {
            const user = window.DB.getUsers().find(u => u.id === savedUserId);
            if (user) {
                this.loginUser(user);
                return;
            }
        }

        // Show login view if no active session
        this.showLoginView();
    },

    // --------------------------------------------------------------------------
    // 1. AUTHENTICATION & LOGIN / REGISTRATION WORKFLOW
    // --------------------------------------------------------------------------
    setAuthView(view) {
        const scholarTab = document.getElementById('login-tab-scholar');
        const staffTab = document.getElementById('login-tab-staff');
        const regTab = document.getElementById('login-tab-register');
        const loginForm = document.getElementById('login-form');
        const regForm = document.getElementById('register-form');

        if (scholarTab) scholarTab.classList.toggle('active', view === 'scholar');
        if (staffTab) staffTab.classList.toggle('active', view === 'staff');
        if (regTab) regTab.classList.toggle('active', view === 'register');

        if (view === 'register') {
            if (loginForm) loginForm.style.display = 'none';
            if (regForm) {
                regForm.style.display = 'block';
                regForm.reset();
                this.handleRegisterRoleChange();
            }
        } else {
            if (regForm) regForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            this.setLoginRole(view);
        }
    },

    toggleAuthMode(mode) {
        this.setAuthView(mode === 'register' ? 'register' : 'scholar');
    },

    handleRegisterRoleChange() {
        const role = document.getElementById('reg-role-select')?.value;
        const progGroup = document.getElementById('reg-program-group');
        if (progGroup) {
            progGroup.style.display = role === 'scholar' ? 'block' : 'none';
        }
    },

    async handleRegisterSubmit() {
        const name = document.getElementById('reg-name-input')?.value;
        const idVal = document.getElementById('reg-id-input')?.value;
        const email = document.getElementById('reg-email-input')?.value;
        const role = document.getElementById('reg-role-select')?.value;
        const program_code = document.getElementById('reg-program-select')?.value;
        const password = document.getElementById('reg-password-input')?.value;

        try {
            const newUser = await window.DB.registerUser({
                student_id: idVal,
                full_name: name,
                email: email,
                role: role,
                program_code: program_code,
                password: password
            });

            this.populateUserSelect();
            this.showAlert(`Account created & saved to Supabase! Welcome, ${newUser.full_name}.`, 'success');
            this.setLoginRole(newUser.role);
            this.loginUser(newUser);
        } catch (err) {
            this.showAlert(err.message, 'error');
        }
    },
    setLoginRole(role) {
        this.currentLoginRole = role;
        const scholarTab = document.getElementById('login-tab-scholar');
        const staffTab = document.getElementById('login-tab-staff');
        if (scholarTab) scholarTab.classList.toggle('active', role === 'scholar');
        if (staffTab) staffTab.classList.toggle('active', role === 'staff');

        const label = document.getElementById('login-id-label');
        const input = document.getElementById('login-id-input');
        if (role === 'staff') {
            if (label) label.textContent = 'Staff ID or Email Address';
            if (input) {
                input.placeholder = 'e.g. STAFF-001 or staff@scholarship.edu';
                input.value = '';
            }
        } else {
            if (label) label.textContent = 'Student ID or Scholar Email';
            if (input) {
                input.placeholder = 'e.g. A01 or a01@scholar.edu';
                input.value = '';
            }
        }
    },

    togglePasswordVisibility() {
        const pwdInput = document.getElementById('login-password-input');
        const toggleBtn = document.getElementById('toggle-password-btn');
        if (!pwdInput || !toggleBtn) return;
        if (pwdInput.type === 'password') {
            pwdInput.type = 'text';
            toggleBtn.textContent = 'Hide';
            toggleBtn.setAttribute('aria-label', 'Hide password');
        } else {
            pwdInput.type = 'password';
            toggleBtn.textContent = 'Show';
            toggleBtn.setAttribute('aria-label', 'Show password');
        }
    },

    async handleLoginSubmit() {
        const idVal = (document.getElementById('login-id-input')?.value || '').trim().toLowerCase();
        const passwordVal = (document.getElementById('login-password-input')?.value || '');
        let users = window.DB.getUsers();

        // 1. Try local cache match by student_id or email
        let user = users.find(u =>
            ((u.student_id && u.student_id.toLowerCase() === idVal) || 
             (u.email && u.email.toLowerCase() === idVal)) &&
            u.role === this.currentLoginRole
        );

        // Fallback without role restriction
        if (!user) {
            user = users.find(u =>
                (u.student_id && u.student_id.toLowerCase() === idVal) || 
                (u.email && u.email.toLowerCase() === idVal)
            );
        }

        // 2. If not found in cache, query live Supabase Cloud in real time!
        if (!user) {
            try {
                await window.DB.syncWithSupabase();
                users = window.DB.getUsers();
                user = users.find(u =>
                    (u.student_id && u.student_id.toLowerCase() === idVal) || 
                    (u.email && u.email.toLowerCase() === idVal)
                );
            } catch (err) {
                console.warn('Real-time login sync note:', err);
            }
        }

        if (!user) {
            this.showAlert(`Authentication Failed: No active account matching "${idVal}". Please check your email/ID or click Create Account.`, 'error');
            return;
        }

        // 3. Validate password
        if (!passwordVal) {
            this.showAlert('Authentication Failed: Please enter your password.', 'error');
            return;
        }
        if (user.password && passwordVal !== user.password) {
            this.showAlert('Authentication Failed: Incorrect password. Please try again.', 'error');
            return;
        }

        this.setLoginRole(user.role);
        this.loginUser(user);
        this.showAlert(`Welcome back, ${user.full_name}! (${user.role.toUpperCase()} DASHBOARD)`, 'success');
    },

    loginUser(user) {
        this.currentUser = user;
        sessionStorage.setItem('SAD_AUTH_USER_ID', user.id);

        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-main-view').style.display = 'block';

        // Update identity elements
        document.getElementById('current-user-name').textContent = user.full_name;
        document.getElementById('current-user-role-badge').textContent = user.role.toUpperCase();
        document.getElementById('current-user-id').textContent = `ID: ${user.student_id}`;

        // Minimalist uppercase initials avatar
        const initials = user.full_name
            .replace(/^(Atty\.|Dr\.|Engr\.)\s*/i, '')
            .split(' ')
            .filter(n => n.length > 0)
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'U';
        document.getElementById('current-user-avatar').textContent = initials;

        const progEl = document.getElementById('current-user-program');
        if (progEl) {
            progEl.textContent = user.program_code ? `(${user.program_code} SCHOLAR)` : '(COORDINATOR)';
        }

        // Sync simulation dropdown selector
        const select = document.getElementById('user-switcher-select');
        if (select) select.value = user.id;

        // Route to the appropriate Actor Dashboard
        if (user.role === 'staff') {
            document.getElementById('staff-dashboard-view').style.display = 'block';
            document.getElementById('scholar-dashboard-view').style.display = 'none';
            this.switchStaffTab('staff-registry');
        } else {
            document.getElementById('staff-dashboard-view').style.display = 'none';
            document.getElementById('scholar-dashboard-view').style.display = 'block';
            this.renderScholarDashboard();
            this.switchScholarTab('scholar-submissions');
        }

        this.refreshDataViews();
    },

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('SAD_AUTH_USER_ID');
        this.showLoginView();
        this.showAlert('You have been signed out.', 'success');
    },

    showLoginView() {
        document.getElementById('app-main-view').style.display = 'none';
        document.getElementById('login-view').style.display = 'flex';
        const idInput = document.getElementById('login-id-input');
        if (idInput) idInput.value = '';
        const pwdInput = document.getElementById('login-password-input');
        if (pwdInput) {
            pwdInput.value = '';
            pwdInput.type = 'password';
        }
        const toggleBtn = document.getElementById('toggle-password-btn');
        if (toggleBtn) {
            toggleBtn.textContent = 'Show';
            toggleBtn.setAttribute('aria-label', 'Show password');
        }
        this.setAuthView(this.currentLoginRole || 'scholar');
    },

    populateUserSelect() {
        const select = document.getElementById('user-switcher-select');
        if (!select) return;
        select.innerHTML = '';
        const users = window.DB.getUsers();

        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.role === 'staff' ? 'Staff' : 'Scholar'}: ${u.full_name} (${u.student_id})`;
            select.appendChild(opt);
        });
    },

    // --------------------------------------------------------------------------
    // 2. SCHOLAR ACTOR DASHBOARD
    // --------------------------------------------------------------------------
    renderScholarDashboard() {
        if (!this.currentUser || this.currentUser.role !== 'scholar') return;

        const scholar = this.currentUser;
        const program = window.DB.getProgramByCode(scholar.program_code) || window.DB.getPrograms()[0];

        // Header Grant Banner
        document.getElementById('scholar-banner-welcome').textContent = `Welcome, ${scholar.full_name}`;
        document.getElementById('scholar-banner-badge').textContent = program.program_name;
        document.getElementById('scholar-banner-policy-desc').textContent =
            `Assigned to ${program.program_name} Grant. Policies are enforced directly against persisted database thresholds.`;

        document.getElementById('scholar-stat-max-gwa').textContent = parseFloat(program.max_gwa).toFixed(2);
        document.getElementById('scholar-stat-min-units').textContent = `${program.min_enrolled_units} Units`;
        document.getElementById('scholar-stat-deadline').textContent = ComplianceEngine.formatDateManila(program.submission_deadline);

        // Pre-fill Grade Submission form
        this.populateScholarSubmitForm(scholar);

        // Render scholar specific submissions and check for Returned status banner
        this.renderScholarSubmissionsTable();
        this.renderScholarProgramPolicies(program);
        this.renderScholarAuditTimeline();
    },

    renderScholarSubmissionsTable() {
        const tbody = document.getElementById('scholar-submissions-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const mySubs = window.DB.getSubmissions(this.currentUser);
        const returnedBanner = document.getElementById('scholar-returned-banner');
        const returnedSub = mySubs.find(s => s.verification_status === 'Returned');

        if (returnedSub) {
            returnedBanner.style.display = 'flex';
            document.getElementById('scholar-returned-banner-reason').textContent =
                `Staff Notes: "${returnedSub.verification_notes || 'Please provide clear, legible grade evidence.'}"`;
        } else {
            returnedBanner.style.display = 'none';
        }

        if (mySubs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2rem;">No submissions recorded yet. Click "Submit Semester Grades" to submit.</td></tr>`;
            return;
        }

        mySubs.forEach(sub => {
            const tr = document.createElement('tr');

            const verifyBadge = `<span class="badge badge-${sub.verification_status.toLowerCase()}">${sub.verification_status}</span>`;
            const compClass = sub.compliance_result === 'Compliant' ? 'compliant' : (sub.compliance_result === 'With Deficiency' ? 'deficiency' : 'pending');
            const compBadge = `<span class="badge badge-${compClass}">${sub.compliance_result}</span>`;
            const renewalClass = sub.renewal_decision === 'Approved' ? 'approved' : (sub.renewal_decision === 'Held' ? 'held' : 'pending');
            const renewalBadge = `<span class="badge badge-${renewalClass}">${sub.renewal_decision}</span>`;

            let actionHtml = '';
            if (sub.verification_status === 'Returned') {
                actionHtml = `<button class="btn btn-danger btn-sm" onclick="App.openResubmitModal('${sub.id}')">Resubmit Link</button>`;
            } else {
                actionHtml = `<span style="font-size:0.75rem; color:var(--text-sub);">Submitted (Read-only)</span>`;
            }

            const formattedTime = ComplianceEngine.formatDateManila(sub.submission_timestamp);

            tr.innerHTML = `
                <td><strong>${sub.academic_year} ${sub.semester}</strong></td>
                <td><strong>${parseFloat(sub.gwa).toFixed(2)}</strong></td>
                <td>${sub.enrolled_units} Units</td>
                <td>F: ${sub.failed_count} • INC: ${sub.inc_count} • Drop: ${sub.dropped_count}</td>
                <td>
                    <a href="${sub.evidence_reference}" target="_blank" class="table-link">
                        <span>View Document</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a><br>
                    <span style="font-size:0.7rem; color:var(--text-sub);">${formattedTime}</span>
                </td>
                <td>${verifyBadge}</td>
                <td>
                    ${compBadge}
                    ${sub.deficiency_reasons ? `<div class="deficiency-reason-chip">${sub.deficiency_reasons}</div>` : ''}
                </td>
                <td>${renewalBadge}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    openResubmitForCurrentScholar() {
        const mySubs = window.DB.getSubmissions(this.currentUser);
        const returnedSub = mySubs.find(s => s.verification_status === 'Returned');
        if (returnedSub) {
            this.openResubmitModal(returnedSub.id);
        }
    },

    renderScholarProgramPolicies(program) {
        const container = document.getElementById('scholar-policies-container');
        if (!container) return;
        container.innerHTML = `
            <div class="policy-card ${program.program_code.toLowerCase()}" style="max-width:550px; margin:0 auto;">
                <h3>
                    <span>${program.program_name} Criteria</span>
                    <span class="badge badge-compliant">${program.program_code}</span>
                </h3>
                <ul class="policy-list">
                    <li><span class="label">Maximum Permitted GWA:</span> <span class="value">${parseFloat(program.max_gwa).toFixed(2)}</span></li>
                    <li><span class="label">Minimum Enrolled Units:</span> <span class="value">${program.min_enrolled_units} Units</span></li>
                    <li><span class="label">Allowed Failed Subjects:</span> <span class="value">${program.allowed_failed}</span></li>
                    <li><span class="label">Allowed Incomplete (INC):</span> <span class="value">${program.allowed_inc}</span></li>
                    <li><span class="label">Allowed Dropped Subjects:</span> <span class="value">${program.allowed_dropped}</span></li>
                    <li><span class="label">Submission Deadline:</span> <span class="value" style="font-size:0.8rem;">${ComplianceEngine.formatDateManila(program.submission_deadline)}</span></li>
                </ul>
            </div>
        `;
    },

    renderScholarAuditTimeline() {
        const container = document.getElementById('scholar-audit-timeline-container');
        if (!container) return;
        container.innerHTML = '';

        const logs = window.DB.getAuditHistory(this.currentUser);
        if (logs.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); padding:1rem; text-align:center;">No audit records found for your account.</p>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            const formattedTime = ComplianceEngine.formatDateManila(log.timestamp);
            item.innerHTML = `
                <div class="timeline-meta">${formattedTime} • <strong>${log.actor_name}</strong></div>
                <div class="timeline-title">${log.action}: ${log.previous_status} ➔ <span style="color:var(--accent-cyan);">${log.new_status}</span></div>
                <div class="timeline-body">${log.notes || 'No extra notes.'}</div>
            `;
            container.appendChild(item);
        });
    },

    populateScholarSubmitForm(user) {
        const prog = window.DB.getProgramByCode(user.program_code) || window.DB.getPrograms()[0];
        const progInput = document.getElementById('scholar-form-program');
        if (progInput) progInput.value = `${prog.program_name} (${prog.program_code})`;
        const nameInput = document.getElementById('scholar-form-name');
        if (nameInput) nameInput.value = `${user.full_name} (${user.student_id})`;
    },

    // --------------------------------------------------------------------------
    // 3. STAFF COORDINATOR ACTOR DASHBOARD
    // --------------------------------------------------------------------------
    updateStatsCards() {
        const semesterFilter = document.getElementById('filter-semester') ? document.getElementById('filter-semester').value : 'Semester 1';
        const progFilter = document.getElementById('filter-program') ? document.getElementById('filter-program').value : 'ALL';

        let allSubs = window.DB.getState().submissions;
        if (semesterFilter !== 'ALL') {
            allSubs = allSubs.filter(s => s.semester === semesterFilter);
        }
        if (progFilter !== 'ALL') {
            allSubs = allSubs.filter(s => s.program_code === progFilter);
        }

        // Dynamically count real scholars registered in Supabase
        const scholars = window.DB.getUsers().filter(u => u.role === 'scholar');
        const totalAssigned = progFilter === 'ALL'
            ? scholars.length
            : scholars.filter(s => s.program_code === progFilter).length;

        const pendingCount = allSubs.filter(s => s.verification_status === 'Pending').length;
        const compliantCount = allSubs.filter(s => s.compliance_result === 'Compliant').length;
        const deficiencyCount = allSubs.filter(s => s.compliance_result === 'With Deficiency').length;

        document.getElementById('stat-total-scholars').textContent = totalAssigned;
        document.getElementById('stat-pending-verification').textContent = pendingCount;
        document.getElementById('stat-compliant').textContent = compliantCount;
        document.getElementById('stat-deficiency').textContent = deficiencyCount;
    },

    renderSubmissionsTable() {
        const tbody = document.getElementById('submissions-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        let subs;
        try {
            subs = window.DB.getSubmissions(this.currentUser);
        } catch (e) {
            return;
        }

        const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
        const progFilter = document.getElementById('filter-program')?.value || 'ALL';
        const compFilter = document.getElementById('filter-compliance')?.value || 'ALL';
        const semFilter = document.getElementById('filter-semester')?.value || 'ALL';

        const filtered = subs.filter(s => {
            const matchesSearch = s.student_id.toLowerCase().includes(searchVal) ||
                                  s.scholar_name.toLowerCase().includes(searchVal);
            const matchesProg = progFilter === 'ALL' || s.program_code === progFilter;
            const matchesComp = compFilter === 'ALL' || s.compliance_result === compFilter;
            const matchesSem = semFilter === 'ALL' || s.semester === semFilter;
            return matchesSearch && matchesProg && matchesComp && matchesSem;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching submissions found.</td></tr>`;
            return;
        }

        filtered.forEach(sub => {
            const tr = document.createElement('tr');

            const verifyBadge = `<span class="badge badge-${sub.verification_status.toLowerCase()}">${sub.verification_status}</span>`;
            const compClass = sub.compliance_result === 'Compliant' ? 'compliant' : (sub.compliance_result === 'With Deficiency' ? 'deficiency' : 'pending');
            const compBadge = `<span class="badge badge-${compClass}">${sub.compliance_result}</span>`;
            const renewalClass = sub.renewal_decision === 'Approved' ? 'approved' : (sub.renewal_decision === 'Held' ? 'held' : 'pending');
            const renewalBadge = `<span class="badge badge-${renewalClass}">${sub.renewal_decision}</span>`;

            const actionHtml = `
                <div class="btn-group">
                    <button class="btn btn-secondary btn-sm" onclick="App.openVerifyModal('${sub.id}')" title="Verify or Return Evidence">Verify</button>
                    <button class="btn btn-primary btn-sm" onclick="App.handleEvaluate('${sub.id}')" title="Run Policy Compliance Evaluation">Evaluate</button>
                    <button class="btn btn-secondary btn-sm" onclick="App.openRenewalModal('${sub.id}')" title="Record Renewal Decision">Decide</button>
                </div>
            `;

            const formattedTime = ComplianceEngine.formatDateManila(sub.submission_timestamp);

            tr.innerHTML = `
                <td><code class="mono-chip">${sub.student_id}</code></td>
                <td><strong>${sub.scholar_name}</strong></td>
                <td><span class="program-tag">${sub.program_code}</span></td>
                <td>${sub.academic_year} ${sub.semester}</td>
                <td><strong class="mono-val">${parseFloat(sub.gwa).toFixed(2)}</strong></td>
                <td>${sub.enrolled_units} u <span style="font-size:0.75rem; color:var(--text-muted);">(F:${sub.failed_count}/I:${sub.inc_count}/D:${sub.dropped_count})</span></td>
                <td>
                    <a href="${sub.evidence_reference}" target="_blank" class="table-link">
                        <span>Document</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a><br>
                    <span style="font-size:0.7rem; color:var(--text-sub);">${formattedTime}</span>
                </td>
                <td>${verifyBadge}</td>
                <td>
                    ${compBadge}
                    ${sub.deficiency_reasons ? `<div class="deficiency-reason-chip">${sub.deficiency_reasons}</div>` : ''}
                </td>
                <td>${renewalBadge}</td>
                <td>${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderPolicies() {
        const container = document.getElementById('policies-container');
        if (!container) return;
        container.innerHTML = '';

        const programs = window.DB.getPrograms();
        programs.forEach(p => {
            const card = document.createElement('div');
            card.className = `policy-card ${p.program_code.toLowerCase()}`;
            card.innerHTML = `
                <h3>
                    <span>${p.program_name}</span>
                    <span class="badge badge-compliant">${p.program_code}</span>
                </h3>
                <ul class="policy-list">
                    <li><span class="label">Max Permitted GWA:</span> <span class="value">${parseFloat(p.max_gwa).toFixed(2)}</span></li>
                    <li><span class="label">Min Enrolled Units:</span> <span class="value">${p.min_enrolled_units} Units</span></li>
                    <li><span class="label">Allowed Failed Subjects:</span> <span class="value">${p.allowed_failed}</span></li>
                    <li><span class="label">Allowed Incomplete (INC):</span> <span class="value">${p.allowed_inc}</span></li>
                    <li><span class="label">Allowed Dropped Subjects:</span> <span class="value">${p.allowed_dropped}</span></li>
                    <li><span class="label">Submission Deadline:</span> <span class="value" style="font-size:0.75rem;">${ComplianceEngine.formatDateManila(p.submission_deadline)}</span></li>
                </ul>
            `;
            container.appendChild(card);
        });
    },

    renderAuditTimeline() {
        const container = document.getElementById('audit-timeline-container');
        if (!container) return;
        container.innerHTML = '';

        const logs = window.DB.getAuditHistory(this.currentUser);
        if (logs.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); padding:1rem; text-align:center;">No audit records found.</p>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            const formattedTime = ComplianceEngine.formatDateManila(log.timestamp);
            item.innerHTML = `
                <div class="timeline-meta">${formattedTime} • <strong>${log.actor_name}</strong> (${log.actor_role})</div>
                <div class="timeline-title">${log.action}: ${log.previous_status} ➔ <span style="color:var(--accent-cyan);">${log.new_status}</span></div>
                <div class="timeline-body">${log.notes || 'No extra notes.'}</div>
            `;
            container.appendChild(item);
        });
    },

    // --------------------------------------------------------------------------
    // 4. TAB CONTROLLERS
    // --------------------------------------------------------------------------
    switchStaffTab(tabId) {
        document.querySelectorAll('#staff-dashboard-view .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        const mapping = {
            'staff-registry': 'tab-staff-registry',
            'staff-policies': 'tab-staff-policies',
            'staff-audit': 'tab-staff-audit',
            'staff-tests': 'tab-staff-tests'
        };

        ['tab-staff-registry', 'tab-staff-policies', 'tab-staff-audit', 'tab-staff-tests'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === mapping[tabId] ? 'block' : 'none';
        });

        if (tabId === 'staff-audit') this.renderAuditTimeline();
    },

    switchScholarTab(tabId) {
        document.querySelectorAll('#scholar-dashboard-view .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        const mapping = {
            'scholar-submissions': 'tab-scholar-submissions',
            'scholar-submit': 'tab-scholar-submit',
            'scholar-policies': 'tab-scholar-policies',
            'scholar-audit': 'tab-scholar-audit'
        };

        ['tab-scholar-submissions', 'tab-scholar-submit', 'tab-scholar-policies', 'tab-scholar-audit'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = id === mapping[tabId] ? 'block' : 'none';
        });

        if (tabId === 'scholar-audit') this.renderScholarAuditTimeline();
    },

    refreshDataViews() {
        if (!this.currentUser) return;
        if (this.currentUser.role === 'staff') {
            this.updateStatsCards();
            this.renderSubmissionsTable();
            this.renderPolicies();
        } else {
            this.renderScholarDashboard();
        }
    },

    // --------------------------------------------------------------------------
    // 5. EVENT BINDINGS
    // --------------------------------------------------------------------------
    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginSubmit();
            });
        }

        // Registration form
        const regForm = document.getElementById('register-form');
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegisterSubmit();
            });
        }

        // Active session switcher dropdown
        const switcher = document.getElementById('user-switcher-select');
        if (switcher) {
            switcher.addEventListener('change', (e) => {
                const user = window.DB.getUsers().find(u => u.id === e.target.value);
                if (user) this.loginUser(user);
            });
        }

        // Staff Tabs
        document.querySelectorAll('#staff-dashboard-view .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.switchStaffTab(tab);
            });
        });

        // Scholar Tabs
        document.querySelectorAll('#scholar-dashboard-view .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.switchScholarTab(tab);
            });
        });

        // Search & Filter
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.addEventListener('input', () => this.renderSubmissionsTable());

        const filterProgram = document.getElementById('filter-program');
        if (filterProgram) filterProgram.addEventListener('change', () => this.renderSubmissionsTable());

        const filterCompliance = document.getElementById('filter-compliance');
        if (filterCompliance) filterCompliance.addEventListener('change', () => this.renderSubmissionsTable());

        const filterSemester = document.getElementById('filter-semester');
        if (filterSemester) filterSemester.addEventListener('change', () => {
            this.updateStatsCards();
            this.renderSubmissionsTable();
        });

        // Scholar Grade Submission Form
        const gradeForm = document.getElementById('grade-submission-form');
        if (gradeForm) {
            gradeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleScholarSubmission();
            });
        }

        // Verification Modal Form
        const verifyForm = document.getElementById('verify-modal-form');
        if (verifyForm) {
            verifyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitVerificationDecision();
            });
        }

        // Resubmission Modal Form
        const resubmitForm = document.getElementById('resubmit-modal-form');
        if (resubmitForm) {
            resubmitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitResubmission();
            });
        }

        // Renewal Decision Modal Form
        const renewalForm = document.getElementById('renewal-modal-form');
        if (renewalForm) {
            renewalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitRenewalDecision();
            });
        }

        // Proceed to Decide from Evaluation modal
        const proceedDecideBtn = document.getElementById('eval-modal-proceed-decide-btn');
        if (proceedDecideBtn) {
            proceedDecideBtn.addEventListener('click', () => {
                if (this.selectedSubmissionForAction) {
                    this.openRenewalModal(this.selectedSubmissionForAction.id);
                }
            });
        }

        // Test Suite Run Button
        const runTestBtn = document.getElementById('run-tests-btn');
        if (runTestBtn) {
            runTestBtn.addEventListener('click', () => this.runTestRunner());
        }

        // Reset database button
        const resetDbBtn = document.getElementById('reset-db-btn');
        if (resetDbBtn) {
            resetDbBtn.addEventListener('click', () => {
                if (confirm('Reset database to clean initial exam seed state (Records A01 - A06)?')) {
                    window.DB.resetToDefaultSeed();
                    this.showAlert('Database reset to clean exam baseline.', 'success');
                    this.refreshDataViews();
                }
            });
        }
    },

    // --------------------------------------------------------------------------
    // 6. SCHOLAR GRADE INTAKE & VALIDATION (FR05, FR06, TC07)
    // --------------------------------------------------------------------------
    handleScholarSubmission() {
        if (!this.currentUser || this.currentUser.role !== 'scholar') {
            this.showAlert('Only authenticated scholars can submit grades.', 'error');
            return;
        }

        const formData = {
            academic_year: document.getElementById('submit-ay').value,
            semester: document.getElementById('submit-semester').value,
            gwa: document.getElementById('submit-gwa').value,
            enrolled_units: document.getElementById('submit-units').value,
            failed_count: document.getElementById('submit-failed').value,
            inc_count: document.getElementById('submit-inc').value,
            dropped_count: document.getElementById('submit-dropped').value,
            evidence_reference: document.getElementById('submit-evidence-link').value
        };

        try {
            window.DB.createSubmission(this.currentUser, formData);
            this.showAlert(`Submission successful for ${formData.academic_year} ${formData.semester}! Record is now Pending staff verification.`, 'success');
            document.getElementById('grade-submission-form').reset();
            this.populateScholarSubmitForm(this.currentUser);
            this.refreshDataViews();
            this.switchScholarTab('scholar-submissions');
        } catch (err) {
            this.showAlert(err.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // 7. STAFF VERIFICATION, EVALUATION, AND RENEWAL (FR07, FR09, FR10)
    // --------------------------------------------------------------------------
    openVerifyModal(submissionId) {
        const sub = window.DB.getState().submissions.find(s => s.id === submissionId);
        if (!sub) return;
        this.selectedSubmissionForAction = sub;

        document.getElementById('verify-modal-sub-id').textContent = `${sub.student_id} - ${sub.scholar_name}`;
        document.getElementById('verify-modal-evidence-link').href = sub.evidence_reference;
        document.getElementById('verify-status-select').value = sub.verification_status === 'Returned' ? 'Returned' : 'Verified';
        document.getElementById('verify-notes-input').value = sub.verification_notes || '';

        this.toggleModal('verify-modal', true);
    },

    submitVerificationDecision() {
        const status = document.getElementById('verify-status-select').value;
        const notes = document.getElementById('verify-notes-input').value;

        try {
            window.DB.verifyEvidence(this.currentUser, this.selectedSubmissionForAction.id, status, notes);
            this.showAlert(`Verification updated to "${status}" for ${this.selectedSubmissionForAction.student_id}.`, 'success');
            this.toggleModal('verify-modal', false);
            this.refreshDataViews();
        } catch (err) {
            this.showAlert(err.message, 'error');
        }
    },

    handleEvaluate(submissionId) {
        try {
            const { submission, evaluation } = window.DB.runEvaluation(this.currentUser, submissionId);
            this.selectedSubmissionForAction = submission;

            document.getElementById('eval-modal-scholar-name').textContent = `${submission.scholar_name} (${submission.student_id})`;
            document.getElementById('eval-modal-program-name').textContent = `${submission.program_name} • Academic Year ${submission.academic_year} ${submission.semester}`;

            const badgeClass = submission.compliance_result === 'Compliant' ? 'compliant' : 'deficiency';
            document.getElementById('eval-modal-status-badge').innerHTML = `<span class="badge badge-${badgeClass}" style="font-size:0.9rem; padding:0.4rem 0.85rem;">${submission.compliance_result}</span>`;

            const reasonsBox = document.getElementById('eval-modal-reasons-container');
            const reasonsList = document.getElementById('eval-modal-reasons-list');
            if (evaluation.reasons && evaluation.reasons.length > 0) {
                reasonsBox.style.display = 'block';
                reasonsList.innerHTML = evaluation.reasons.map(r => `<li>${r}</li>`).join('');
            } else {
                reasonsBox.style.display = 'none';
                reasonsList.innerHTML = '';
            }

            const tbody = document.getElementById('eval-modal-checks-tbody');
            tbody.innerHTML = '';
            evaluation.checks.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${c.rule}</strong><br><span style="color:var(--text-muted); font-size:0.75rem;">${c.details}</span></td>
                    <td><code>${c.threshold}</code></td>
                    <td><code>${c.actual}</code></td>
                    <td><span class="${c.passed ? 'test-pass' : 'test-fail'}">${c.passed ? '✅ PASSED' : '❌ FAILED'}</span></td>
                `;
                tbody.appendChild(tr);
            });

            this.toggleModal('evaluate-modal', true);
            this.showAlert(`Evaluation Complete for ${submission.student_id}: [${submission.compliance_result}]`, submission.compliance_result === 'Compliant' ? 'success' : 'error');
            this.refreshDataViews();
        } catch (err) {
            this.showAlert(err.message, 'error');
        }
    },

    openRenewalModal(submissionId) {
        this.toggleModal('evaluate-modal', false);
        const sub = window.DB.getState().submissions.find(s => s.id === submissionId);
        if (!sub) {
            this.showAlert('Submission not found.', 'error');
            return;
        }
        this.selectedSubmissionForAction = sub;

        document.getElementById('renewal-modal-sub-id').textContent = `${sub.student_id} - ${sub.scholar_name} (Current Compliance: ${sub.compliance_result})`;
        document.getElementById('renewal-notes-input').value = sub.decision_notes || '';

        const alertBox = document.getElementById('renewal-modal-alert');
        const select = document.getElementById('renewal-decision-select');
        const helper = document.getElementById('renewal-decision-helper');

        if (sub.compliance_result === 'With Deficiency') {
            alertBox.style.display = 'block';
            alertBox.className = 'alert-banner show alert-error';
            alertBox.style.position = 'static';
            alertBox.style.marginBottom = '1rem';
            alertBox.style.maxWidth = '100%';
            alertBox.innerHTML = `⚠️ <strong>Rule BR06 Notice:</strong> Record has an academic deficiency. Policy strictly prohibits 'Approved' status. Renewal must be recorded as <strong>'Held'</strong>.`;

            select.value = 'Held';
            select.querySelector('option[value="Approved"]').disabled = true;
            helper.textContent = 'Rule BR06 strictly blocks approval for deficient records.';
        } else if (sub.compliance_result === 'Compliant') {
            alertBox.style.display = 'block';
            alertBox.className = 'alert-banner show alert-success';
            alertBox.style.position = 'static';
            alertBox.style.marginBottom = '1rem';
            alertBox.style.maxWidth = '100%';
            alertBox.innerHTML = `✅ <strong>Eligible for Renewal:</strong> Scholar meets all policy criteria for renewal approval.`;

            select.querySelector('option[value="Approved"]').disabled = false;
            select.value = sub.renewal_decision === 'Approved' ? 'Approved' : 'Approved';
            helper.textContent = 'Staff may record Approved or Held based on deliberation.';
        } else {
            alertBox.style.display = 'block';
            alertBox.className = 'alert-banner show alert-error';
            alertBox.style.position = 'static';
            alertBox.style.marginBottom = '1rem';
            alertBox.style.maxWidth = '100%';
            alertBox.innerHTML = `⏳ <strong>Pending Verification:</strong> Evidence must be verified and evaluated before renewal decision.`;

            select.value = 'Held';
            select.querySelector('option[value="Approved"]').disabled = true;
        }

        this.toggleModal('renewal-modal', true);
    },

    submitRenewalDecision() {
        const decision = document.getElementById('renewal-decision-select').value;
        const notes = document.getElementById('renewal-notes-input').value;

        try {
            window.DB.recordRenewalDecision(this.currentUser, this.selectedSubmissionForAction.id, decision, notes);
            this.showAlert(`Renewal decision recorded as "${decision}" for ${this.selectedSubmissionForAction.student_id}.`, 'success');
            this.toggleModal('renewal-modal', false);
            this.refreshDataViews();
        } catch (err) {
            this.showAlert(err.message, 'error');
            const alertBox = document.getElementById('renewal-modal-alert');
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.className = 'alert-banner show alert-error';
                alertBox.textContent = err.message;
            }
        }
    },

    openResubmitModal(submissionId) {
        const sub = window.DB.getState().submissions.find(s => s.id === submissionId);
        if (!sub) return;
        this.selectedSubmissionForAction = sub;

        document.getElementById('resubmit-return-reason').textContent = sub.verification_notes || 'Please provide updated, clear document reference.';
        document.getElementById('resubmit-evidence-input').value = sub.evidence_reference;

        this.toggleModal('resubmit-modal', true);
    },

    submitResubmission() {
        const newUrl = document.getElementById('resubmit-evidence-input').value;
        try {
            window.DB.resubmitCorrection(this.currentUser, this.selectedSubmissionForAction.id, newUrl);
            this.showAlert('Corrected grade document submitted successfully! Status has returned to Pending verification.', 'success');
            this.toggleModal('resubmit-modal', false);
            this.refreshDataViews();
        } catch (err) {
            this.showAlert(err.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // 8. MANDATORY TEST RUNNER (TC01 - TC10)
    // --------------------------------------------------------------------------
    async runTestRunner() {
        const tbody = document.getElementById('test-results-tbody');
        const summaryBadge = document.getElementById('test-summary-badge');
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">Running all 10 mandatory functional tests...</td></tr>`;

        const results = await window.TestSuite.runAllTests();

        tbody.innerHTML = '';
        let passCount = 0;

        results.forEach(res => {
            if (res.passed) passCount++;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code class="mono-chip">${res.testId}</code></td>
                <td><strong>${res.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${res.input}</span></td>
                <td><span style="font-size:0.8rem;">${res.expected}</span></td>
                <td><span style="font-size:0.8rem;">${res.actual}</span></td>
                <td><span class="${res.passed ? 'test-pass' : 'test-fail'}">${res.passed ? 'PASS' : 'FAIL'}</span></td>
                <td style="font-size:0.75rem; color:var(--text-muted);">${res.evidence}</td>
            `;
            tbody.appendChild(tr);
        });

        summaryBadge.textContent = `${passCount} / ${results.length} Tests Passed (${Math.round((passCount / results.length) * 100)}%)`;
        summaryBadge.className = passCount === results.length ? 'badge badge-verified' : 'badge badge-deficiency';

        // Re-sync real data from Supabase after sandboxed tests complete
        await window.DB.syncWithSupabase();
        this.refreshDataViews();
    },

    // --------------------------------------------------------------------------
    // UTILITIES & MODAL HELPERS
    // --------------------------------------------------------------------------
    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.toggle('active', show);
        }
    },

    showAlert(message, type = 'info') {
        const banner = document.getElementById('app-alert-banner');
        if (!banner) return;
        banner.className = `alert-banner show ${type === 'success' ? 'alert-success' : 'alert-error'}`;
        banner.textContent = message;

        clearTimeout(this.alertTimeout);
        this.alertTimeout = setTimeout(() => {
            banner.classList.remove('show');
        }, 5000);
    }
};

window.App = App;
