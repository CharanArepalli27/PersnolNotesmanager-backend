const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());
app.use(cors());
const dbPath = path.join(__dirname, "notes.db");
let db = null;
const PORT = process.env.PORT || 3000;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//!API for getting all notes and Filtered Notes
app.get("/notes", async (request, response) => {
  const gettingAllNotes = `SELECT * FROM Notes ORDER BY created_at DESC`;
  const APIForGettingNotes = await db.all(gettingAllNotes);
  response.send(APIForGettingNotes);
});

//!API for getting specific category Notes
app.get("/notes/:category", async (request, response) => {
  const { category } = request.params;
  const capitalCategory = category.toUpperCase();

  try {
    const getSpecificCategoryQuery = `
      SELECT * FROM notes WHERE category = ? ORDER BY created_at DESC
    `;
    const specificCategoryNotes = await db.all(getSpecificCategoryQuery, [
      capitalCategory,
    ]);

    if (specificCategoryNotes.length === 0) {
      response
        .status(404)
        .send({ error: "No notes found for the given category" });
    } else {
      response.send(specificCategoryNotes);
    }
  } catch (error) {
    response
      .status(500)
      .send({ error: "An error occurred while fetching notes" });
  }
});

//!API for adding a new Note
app.post("/notes", async (request, response) => {
  const { title, description, category } = request.body;
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  if (!title || !description) {
    return response
      .status(400)
      .json({ message: "Title and description are required." });
  }
  const capitalCategory = category.toUpperCase();
  const ValidCategories = ["WORK", "PERSONAL", "Others"];
  if (capitalCategory && !ValidCategories.includes(capitalCategory)) {
    return response.status(400).json({ Message: "Invalid category" });
  }
  try {
    const addingNewNotesQuery = `INSERT INTO notes(id,title,description,category,created_at,updated_at) VALUES(?,?,?,?,?,?)`;
    db.run(addingNewNotesQuery, [
      id,
      title,
      description,
      capitalCategory,
      createdAt,
    ]);
    response.send("Notes added Successfully");
  } catch (error) {
    response.status(404).json({ error: "Error occurred while adding notes" });
  }
});
//!API for updating a notes
app.put("/notes/:id", async (request, response) => {
  const { title, description, category } = request.body;
  const { id } = request.params;
  const updatedAt = new Date().toISOString();
  if (!title || !description) {
    return response
      .status(400)
      .json({ message: "Title and description are required." });
  }
  const capitalCategory = category.toUpperCase();
  const ValidCategories = ["WORK", "PERSONAL", "Others"];
  if (capitalCategory && !ValidCategories.includes(capitalCategory)) {
    return response.status(400).json({ Message: "Invalid category" });
  }
  try {
    const updatingDataQuery = `UPDATE notes SET title = ?,description=?,category=?,updated_at=? WHERE id=?`;
    await db.run(updatingDataQuery, [
      title,
      description,
      category,
      updatedAt,
      id,
    ]);
    response.status(200).json({ Message: "Notes Updates Successfully" });
  } catch (error) {
    response.status(400).json({ error: "Error occurred while updating Notes" });
  }
});
//!API for deleting a Notes
app.delete("/notes/:id", async (request, response) => {
  const { id } = request.params;
  try {
    const deletingNotesQuery = `DELETE FROM notes WHERE id =?`;
    await db.run(deletingNotesQuery, [id]);
    response.status(200).json({ Message: "Notes Deleted Successfully" });
  } catch (error) {
    response.status(400).json({ error: "Error occurred while Deleting" });
  }
});

module.exports = app;
