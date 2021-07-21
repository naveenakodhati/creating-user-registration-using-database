const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const encryptPassword = await bcrypt.hash(password, 10);
  const getUserDetails = `SELECT * FROM user WHERE username='${username}';`;
  const isUser = await db.get(getUserDetails);
  if (isUser === undefined) {
    if (password.length >= 5) {
      const createUser = `INSERT INTO user (username,name,password,gender,location)
        VALUES ('${username}','${name}','${encryptPassword}','${gender}','${location}');`;
      await db.run(createUser);
      response.send("User created successfully");
      response.status(200);
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserDetails = `SELECT * FROM user WHERE username='${username}';`;
  const isUser = await db.get(getUserDetails);
  if (isUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, isUser.password);
    if (comparePassword === true) {
      response.send("Login success!");
      response.status(200);
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserDetails = `SELECT * FROM user WHERE username='${username}';`;
  const isUser = await db.get(getUserDetails);
  if (isUser !== undefined) {
    const comparePassword = await bcrypt.compare(oldPassword, isUser.password);
    const encryptPassword = await bcrypt.hash(newPassword, 10);
    if (comparePassword === true) {
      if (newPassword.length >= 5) {
        const updateUserDetails = `UPDATE user SET 
               password='${encryptPassword}'
               WHERE username='${username}';`;
        const updateUser = await db.run(updateUserDetails);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
