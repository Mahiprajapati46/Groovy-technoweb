import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  course: "",
  year: 1,
};

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    const total = students.length;
    const uniqueCourses = new Set(students.map((student) => student.course)).size;
    const yearFive = students.filter((student) => student.year === 5).length;
    return { total, uniqueCourses, yearFive };
  }, [students]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/students`);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      setMessage("Could not fetch students. Check backend connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "year" ? Number(value) : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId ? `${API_URL}/students/${editingId}` : `${API_URL}/students`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed.");
      }

      await fetchStudents();
      setForm(initialForm);
      setEditingId(null);
      setMessage(editingId ? "Student updated successfully." : "Student created successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleEdit(student) {
    setEditingId(student.id);
    setForm({
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      course: student.course,
      year: student.year,
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this student record?");
    if (!confirmed) return;
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/students/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Delete failed.");
      }
      await fetchStudents();
      setMessage("Student deleted successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="badge">Professional Student Management System</p>
        <h1>Student Registry Dashboard</h1>
        <p className="subtitle">
          Elegant, production-style CRUD built with React, Node.js, and PostgreSQL.
        </p>
      </header>

      <section className="stats-grid">
        <article className="card stat-card">
          <h3>Total Students</h3>
          <p>{stats.total}</p>
        </article>
        <article className="card stat-card">
          <h3>Courses Offered</h3>
          <p>{stats.uniqueCourses}</p>
        </article>
        <article className="card stat-card">
          <h3>Final Year Students</h3>
          <p>{stats.yearFive}</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="card">
          <h2>{editingId ? "Edit Student" : "Add Student"}</h2>
          <form className="student-form" onSubmit={handleSubmit}>
            <label>
              First Name
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </label>
            <label>
              Last Name
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              Course
              <input name="course" value={form.course} onChange={handleChange} required />
            </label>
            <label>
              Year
              <select name="year" value={form.year} onChange={handleChange}>
                {[1, 2, 3, 4, 5].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <button className="btn btn-primary" type="submit">
                {editingId ? "Update Student" : "Create Student"}
              </button>
              <button className="btn btn-soft" type="button" onClick={resetForm}>
                Reset
              </button>
            </div>
          </form>
          {message && <p className="message">{message}</p>}
        </article>

        <article className="card">
          <h2>Student Records</h2>
          {loading ? (
            <p>Loading data...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty">
                        No students yet. Add your first record.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.first_name} {student.last_name}</td>
                        <td>{student.email}</td>
                        <td>{student.course}</td>
                        <td>{student.year}</td>
                        <td className="actions">
                          <button className="btn btn-soft" onClick={() => handleEdit(student)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" onClick={() => handleDelete(student.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default App;
