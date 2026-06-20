require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("DB接続失敗:", err);
    return;
  }
  console.log("MySQL connected");
});

const createTableQuery = `
	CREATE TABLE IF NOT EXISTS tasks(
		id INT AUTO_INCREMENT PRIMARY KEY,
		content VARCHAR(100),
		done BOOLEAN NOT NULL DEFAULT FALSE,
		due_date DATETIME,
		priority INT
	)
	CHARACTER SET utf8mb4;
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.log("テーブル作成失敗:", err);
  } else {
    console.log("tasksテーブル確認完了");
  }
});

//CRUD実装.
//Create.
app.post("/tasks", (req, res) => {
  const { content, due_date, priority } = req.body;
  db.query(
    "INSERT INTO tasks (content,due_date,priority) VALUES (?,?,?)",
    [content, due_date, priority],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Task created", id: result.insertId });
    },
  );
});

//Read.
app.get("/tasks", (req, res) => {
  db.query("SELECT * FROM tasks", (err, data) => {
    if (err) return res.status(500).json(err);
    res.json(data);
  });
});

//Update.
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { content, done, due_date, priority } = req.body;

  const formattedDueDate = due_date === "" ? null : due_date;

  db.query(
    "UPDATE tasks SET content=?, done=?, due_date=?, priority=? WHERE id=?",
    [content, done, formattedDueDate, priority, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Task updated" });
    },
  );
});

//Delete.
/*
app.delete("/tasks/all", (req, res) => {
  db.query("DELETE FROM tasks", (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "All tasks deleted" });
  });
});
*/

app.delete("/tasks/all", (req, res) => {
  // リクエストボディから確認用テキストを取得
  const { confirmText } = req.body;

  // バリデーションチェック
  if (confirmText !== "タスクを一括削除する") {
    console.log("一括削除の拒否: テキストが不一致です");
    return res.status(400).json({
      message: "正しい確認メッセージを入力してください。",
    });
  }

  // 文字列が一致した場合のみSQLを実行
  db.query("DELETE FROM tasks", (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "All tasks deleted" });
  });
});

app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM tasks WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Task deleted" });
  });
});

//サーバーポート.
app.listen(5000, (req, res) => {
  console.log("Server is running");
});
