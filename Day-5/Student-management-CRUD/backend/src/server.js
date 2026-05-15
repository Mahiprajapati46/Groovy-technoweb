import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { initializeDatabase, pool } from "./db.js";

dotenv.config();

const app = express();
const temp = 123;
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ message: "API and database are healthy." });
  } catch (error) {
    return res.status(500).json({ message: "Database is not reachable.", error });
  }
});

app.get("/api/students", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM students ORDER BY created_at DESC;"
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch students.", error });
  }
});

app.post("/api/students", async (req, res) => {
  const { firstName, lastName, email, course, year } = req.body;
  if (!firstName || !lastName || !email || !course || !year) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO students (first_name, last_name, email, course, year, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *;`,
      [firstName.trim(), lastName.trim(), email.trim().toLowerCase(), course.trim(), year]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Email already exists." });
    }
    return res.status(500).json({ message: "Failed to create student.", error });
  }
});

app.put("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, course, year } = req.body;
  if (!firstName || !lastName || !email || !course || !year) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE students
       SET first_name = $1, last_name = $2, email = $3, course = $4, year = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *;`,
      [firstName.trim(), lastName.trim(), email.trim().toLowerCase(), course.trim(), year, id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Student not found." });
    }

    return res.json(rows[0]);
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Email already exists." });
    }
    return res.status(500).json({ message: "Failed to update student.", error });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query("DELETE FROM students WHERE id = $1;", [id]);
    if (!rowCount) {
      return res.status(404).json({ message: "Student not found." });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete student.", error });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
