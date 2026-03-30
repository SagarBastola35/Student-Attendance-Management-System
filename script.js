
class AttendanceSystem {
  constructor() {
    this.students = [];
    this.attendanceRecords = [];
    this.currentView = "dashboard";
    this.init();
  }

  init() {
    this.loadFromLocalStorage();
    this.setupEventListeners();
    this.renderCurrentView();
  }

  loadFromLocalStorage() {
    const storedStudents = localStorage.getItem("attendify_students");
    const storedAttendance = localStorage.getItem("attendify_attendance");

    this.students = storedStudents ? JSON.parse(storedStudents) : [];
    this.attendanceRecords = storedAttendance
      ? JSON.parse(storedAttendance)
      : [];

    if (this.students.length === 0) {
      this.addSampleData();
    }
  }

  addSampleData() {
    const sampleStudents = [
      {
        id: this.generateId(),
        name: "Emma Watson",
        rollNumber: "CS001",
        className: "Computer Science",
        email: "emma@example.com",
      },
      {
        id: this.generateId(),
        name: "Liam Chen",
        rollNumber: "CS002",
        className: "Computer Science",
        email: "liam@example.com",
      },
      {
        id: this.generateId(),
        name: "Sophia Rodriguez",
        rollNumber: "CS003",
        className: "Computer Science",
        email: "sophia@example.com",
      },
      {
        id: this.generateId(),
        name: "Noah Williams",
        rollNumber: "CS004",
        className: "Computer Science",
        email: "noah@example.com",
      },
      {
        id: this.generateId(),
        name: "Ava Johnson",
        rollNumber: "CS005",
        className: "Computer Science",
        email: "ava@example.com",
      },
    ];

    this.students = sampleStudents;

    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      this.students.forEach((student, idx) => {
        const status =
          idx % 3 === 0 ? "present" : idx % 3 === 1 ? "absent" : "late";
        this.attendanceRecords.push({
          studentId: student.id,
          date: dateStr,
          status: status,
        });
      });
    }

    this.saveToLocalStorage();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  saveToLocalStorage() {
    localStorage.setItem("attendify_students", JSON.stringify(this.students));
    localStorage.setItem(
      "attendify_attendance",
      JSON.stringify(this.attendanceRecords),
    );
  }

  addStudent(studentData) {
    const newStudent = {
      id: this.generateId(),
      ...studentData,
    };
    this.students.push(newStudent);
    this.saveToLocalStorage();
    return newStudent;
  }

  deleteStudent(studentId) {
    this.students = this.students.filter((s) => s.id !== studentId);
    this.attendanceRecords = this.attendanceRecords.filter(
      (record) => record.studentId !== studentId,
    );
    this.saveToLocalStorage();
  }

  markAttendance(studentId, date, status) {
    this.attendanceRecords = this.attendanceRecords.filter(
      (record) => !(record.studentId === studentId && record.date === date),
    );

    this.attendanceRecords.push({
      studentId,
      date,
      status,
    });

    this.saveToLocalStorage();
  }

  getAttendanceForDate(date) {
    return this.attendanceRecords.filter((record) => record.date === date);
  }

  getStudentAttendanceStats(studentId) {
    const studentRecords = this.attendanceRecords.filter(
      (record) => record.studentId === studentId,
    );
    const total = studentRecords.length;
    const present = studentRecords.filter((r) => r.status === "present").length;
    const absent = studentRecords.filter((r) => r.status === "absent").length;
    const late = studentRecords.filter((r) => r.status === "late").length;

    return {
      total,
      present,
      absent,
      late,
      percentage: total
        ? (((present + late * 0.5) / total) * 100).toFixed(1)
        : 0,
    };
  }

  getOverallStats() {
    const totalStudents = this.students.length;
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = this.getAttendanceForDate(today);

    const presentToday = todayAttendance.filter(
      (r) => r.status === "present",
    ).length;
    const absentToday = todayAttendance.filter(
      (r) => r.status === "absent",
    ).length;
    const lateToday = todayAttendance.filter((r) => r.status === "late").length;

    const uniqueDates = [...new Set(this.attendanceRecords.map((r) => r.date))];
    const totalAttendanceDays = uniqueDates.length;

    return {
      totalStudents,
      presentToday,
      absentToday,
      lateToday,
      totalAttendanceDays,
      attendanceRate:
        totalStudents && totalAttendanceDays
          ? (
              (this.attendanceRecords.filter(
                (r) => r.status === "present" || r.status === "late",
              ).length /
                (totalStudents * totalAttendanceDays)) *
              100
            ).toFixed(1)
          : 0,
    };
  }

  getRecentAttendance(days = 7) {
    const dates = [...new Set(this.attendanceRecords.map((r) => r.date))]
      .sort()
      .reverse();
    const recentDates = dates.slice(0, days);

    return recentDates.map((date) => {
      const records = this.getAttendanceForDate(date);
      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const late = records.filter((r) => r.status === "late").length;
      return { date, present, absent, late, total: records.length };
    });
  }

  setupEventListeners() {
    const navLinks = document.querySelectorAll(".nav-links li a");
    const menuToggle = document.getElementById("menuToggle");
    const navLinksContainer = document.getElementById("navLinks");

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const view = link.dataset.nav;
        if (view) {
          this.currentView = view;
          this.renderCurrentView();

          navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");

          if (navLinksContainer.classList.contains("active")) {
            navLinksContainer.classList.remove("active");
          }
        }
      });
    });

    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        navLinksContainer.classList.toggle("active");
      });
    }
  }

  renderCurrentView() {
    const mainContainer = document.getElementById("mainContent");
    let html = "";

    switch (this.currentView) {
      case "dashboard":
        html = this.renderDashboard();
        break;
      case "students":
        html = this.renderStudents();
        break;
      case "attendance":
        html = this.renderAttendance();
        break;
      case "reports":
        html = this.renderReports();
        break;
      default:
        html = this.renderDashboard();
    }

    mainContainer.innerHTML = html;
    this.attachViewEventListeners();
  }

  renderDashboard() {
    const stats = this.getOverallStats();
    const recentAttendance = this.getRecentAttendance(5);

    return `
            <div class="card">
                <div class="section-title">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard Overview</span>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Total Students</h3>
                            <div class="stat-number">${stats.totalStudents}</div>
                        </div>
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Present Today</h3>
                            <div class="stat-number" style="color: #10b981;">${stats.presentToday}</div>
                        </div>
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Absent Today</h3>
                            <div class="stat-number" style="color: #ef4444;">${stats.absentToday}</div>
                        </div>
                        <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-info">
                            <h3>Overall Attendance Rate</h3>
                            <div class="stat-number">${stats.attendanceRate}%</div>
                        </div>
                        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                    </div>
                </div>
                
                <div style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Recent Attendance Trend</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr><th>Date</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th></tr>
                            </thead>
                            <tbody>
                                ${recentAttendance
                                  .map(
                                    (day) => `
                                    <tr>
                                        <td>${day.date}</td>
                                        <td><span class="status-badge status-present">${day.present}</span></td>
                                        <td><span class="status-badge status-absent">${day.absent}</span></td>
                                        <td><span class="status-badge status-late">${day.late}</span></td>
                                        <td>${day.total}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                                ${recentAttendance.length === 0 ? '<tr><td colspan="5" class="empty-state">No attendance records yet</td></tr>' : ""}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
  }

  renderStudents() {
    return `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div class="section-title" style="margin-bottom: 0;">
                        <i class="fas fa-users"></i>
                        <span>Student Management</span>
                    </div>
                    <button class="btn btn-primary" id="addStudentBtn">
                        <i class="fas fa-plus"></i> Add New Student
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr><th>Roll Number</th><th>Name</th><th>Class</th><th>Email</th><th>Attendance Stats</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            ${this.students
                              .map((student) => {
                                const stats = this.getStudentAttendanceStats(
                                  student.id,
                                );
                                return `
                                    <tr data-student-id="${student.id}">
                                        <td>${student.rollNumber}</td>
                                        <td><strong>${this.escapeHtml(student.name)}</strong></td>
                                        <td>${student.className}</td>
                                        <td>${student.email}</td>
                                        <td>
                                            <div style="font-size: 0.8rem;">
                                                <span class="status-badge status-present">P:${stats.present}</span>
                                                <span class="status-badge status-absent">A:${stats.absent}</span>
                                                <span class="status-badge status-late">L:${stats.late}</span>
                                                <br>Rate: ${stats.percentage}%
                                            </div>
                                        </td>
                                        <td>
                                            <button class="btn btn-outline delete-student" data-id="${student.id}" style="padding: 0.3rem 0.8rem;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                              })
                              .join("")}
                            ${this.students.length === 0 ? '<tr><td colspan="6" class="empty-state"><i class="fas fa-user-graduate"></i><br>No students enrolled. Click "Add New Student" to begin.</td></tr>' : ""}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
  }

  renderAttendance() {
    const todayDate = new Date().toISOString().split("T")[0];

    return `
            <div class="card">
                <div class="section-title">
                    <i class="fas fa-calendar-check"></i>
                    <span>Mark Attendance</span>
                </div>
                
                <div style="margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <label>Select Date:</label>
                        <input type="date" id="attendanceDate" value="${todayDate}" style="width: auto;">
                    </div>
                    <button class="btn btn-primary" id="loadAttendanceBtn">
                        <i class="fas fa-sync-alt"></i> Load Students
                    </button>
                </div>
                
                <div id="attendanceTableContainer">
                    ${this.renderAttendanceTable(todayDate)}
                </div>
            </div>
        `;
  }

  renderAttendanceTable(date) {
    const attendanceMap = new Map();
    this.getAttendanceForDate(date).forEach((record) => {
      attendanceMap.set(record.studentId, record.status);
    });

    if (this.students.length === 0) {
      return '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>No students found. Please add students first.</div>';
    }

    return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr><th>Roll No</th><th>Student Name</th><th>Attendance Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${this.students
                          .map((student) => {
                            const currentStatus =
                              attendanceMap.get(student.id) || "present";
                            return `
                                <tr data-student="${student.id}">
                                    <td>${student.rollNumber}</td>
                                    <td><strong>${this.escapeHtml(student.name)}</strong></td>
                                    <td>
                                        <span class="status-badge status-${currentStatus === "present" ? "present" : currentStatus === "absent" ? "absent" : "late"}">
                                            ${currentStatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="attendance-toggle">
                                            <button class="attn-btn ${currentStatus === "present" ? "present-active" : ""}" data-status="present">Present</button>
                                            <button class="attn-btn ${currentStatus === "absent" ? "absent-active" : ""}" data-status="absent">Absent</button>
                                            <button class="attn-btn ${currentStatus === "late" ? "late-active" : ""}" data-status="late">Late</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  renderReports() {
    return `
            <div class="card">
                <div class="section-title">
                    <i class="fas fa-chart-bar"></i>
                    <span>Attendance Reports & Analytics</span>
                </div>
                
                <h3 style="margin: 1.5rem 0 1rem;">Student-wise Attendance Summary</h3>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr><th>Roll No</th><th>Student Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr>
                        </thead>
                        <tbody>
                            ${this.students
                              .map((student) => {
                                const stats = this.getStudentAttendanceStats(
                                  student.id,
                                );
                                return `
                                    <tr>
                                        <td>${student.rollNumber}</td>
                                        <td>${this.escapeHtml(student.name)}</td>
                                        <td class="status-present" style="font-weight:600;">${stats.present}</td>
                                        <td class="status-absent">${stats.absent}</td>
                                        <td class="status-late">${stats.late}</td>
                                        <td><strong>${stats.percentage}%</strong></td>
                                    </tr>
                                `;
                              })
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
  }

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  attachViewEventListeners() {
    document.querySelectorAll(".delete-student").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.id;
        if (
          confirm(
            "Delete this student? All attendance records will be removed.",
          )
        ) {
          this.deleteStudent(id);
          this.renderCurrentView();
        }
      });
    });

    const addBtn = document.getElementById("addStudentBtn");
    if (addBtn)
      addBtn.addEventListener("click", () => this.showAddStudentModal());

    const datePicker = document.getElementById("attendanceDate");
    const loadBtn = document.getElementById("loadAttendanceBtn");
    if (loadBtn && datePicker) {
      const refreshTable = () => {
        const container = document.getElementById("attendanceTableContainer");
        if (container)
          container.innerHTML = this.renderAttendanceTable(datePicker.value);
        this.attachAttendanceButtons(datePicker.value);
      };
      loadBtn.addEventListener("click", refreshTable);
      datePicker.addEventListener("change", refreshTable);
      this.attachAttendanceButtons(datePicker.value);
    }
  }

  attachAttendanceButtons(date) {
    document.querySelectorAll(".attn-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const row = btn.closest("tr");
        const studentId = row.dataset.student;
        const status = btn.dataset.status;

        this.markAttendance(studentId, date, status);

        const container = document.getElementById("attendanceTableContainer");
        if (container) container.innerHTML = this.renderAttendanceTable(date);
        this.attachAttendanceButtons(date);
      });
    });
  }

  showAddStudentModal() {
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "studentModal";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> Add New Student</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="addStudentForm">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" id="studentName" required placeholder="Enter full name">
                    </div>
                    <div class="form-group">
                        <label>Roll Number *</label>
                        <input type="text" id="studentRoll" required placeholder="e.g., CS101">
                    </div>
                    <div class="form-group">
                        <label>Class / Section</label>
                        <input type="text" id="studentClass" placeholder="e.g., Computer Science">
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="studentEmail" placeholder="student@example.com">
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="btn btn-outline" id="cancelModalBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add Student</button>
                    </div>
                </form>
            </div>
        `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector(".close-modal").addEventListener("click", closeModal);
    modal
      .querySelector("#cancelModalBtn")
      .addEventListener("click", closeModal);

    modal.querySelector("#addStudentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("studentName").value.trim();
      const roll = document.getElementById("studentRoll").value.trim();
      const className =
        document.getElementById("studentClass").value.trim() || "General";
      const email = document.getElementById("studentEmail").value.trim() || "";

      if (name && roll) {
        this.addStudent({
          name: name,
          rollNumber: roll,
          className: className,
          email: email,
        });
        modal.remove();
        this.renderCurrentView();
      } else {
        alert("Please fill in Name and Roll Number");
      }
    });
  }
}

// Initialize the application
const app = new AttendanceSystem();
