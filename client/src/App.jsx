import { useState, useEffect } from "react";

const API = "http://localhost:5000/tasks";

function App() {
  const [tasks, setTasks] = useState([]);

  const [addedTask, setAddedTask] = useState("");
  const [addedDueDate, setAddedDueDate] = useState("");
  const [addedPriority, setAddedPriority] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingPriority, setEditingPriority] = useState(null);

  const [sortType, setSortType] = useState("default");

  const [urgentThreshold, setUrgentThreshold] = useState(24);
  const [warningThreshold, setWarningThreshold] = useState(7);
  const [safeThreshold, setSafeThreshold] = useState(4);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  //CRUD実装.
  //Create.
  const addTask = async () => {
    if (!addedTask) return;
    const res = await fetch(`${API}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: addedTask,
        due_date: addedDueDate === "" ? null : addedDueDate,
        priority: addedPriority,
      }),
    });
    const { message } = await res.json();

    console.log(message);
    loadTasks();
    setAddedTask("");
    setAddedDueDate("");
    setAddedPriority(null);
  };

  //Read.
  const loadTasks = async () => {
    const res = await fetch(`${API}`, { method: "GET" });
    const data = await res.json();

    setTasks(data);
  };

  //Update.
  //チェックボックスの完了未完了変更.
  const toggleDone = async (task) => {
    if (task.done && !confirm("未完了にしますか？")) return;

    const res = await fetch(`${API}/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: task.content,
        done: !task.done,
        due_date: task.due_date,
        priority: task.priority,
      }),
    });

    const { message } = await res.json();
    console.log(message);

    loadTasks();
  };

  //編集開始.
  const startEdit = (task) => {
    setEditingId(task.id);
    setEditingContent(task.content);
    // ISO形式 (2026-04-04T03:07:00.000Z) から
    // datetime-local用 (2026-04-04T03:07) に変換
    if (task.due_date) {
      const date = new Date(task.due_date);
      // ローカルのタイムゾーンを考慮して YYYY-MM-DDTHH:mm を作成
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      setEditingDueDate(localISOTime);
    } else {
      setEditingDueDate("");
    }
    setEditingPriority(task.priority);
  };

  //保存.
  const saveEdit = async (task) => {
    const res = await fetch(`${API}/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: editingContent,
        done: task.done,
        due_date: editingDueDate === "" ? null : editingDueDate,
        priority: editingPriority,
      }),
    });
    const { message } = await res.json();
    console.log(message);

    setEditingId(null);
    loadTasks();
  };

  //Delete.
  const deleteTask = async (task) => {
    if (!confirm("本当に削除しますか？")) return;

    try {
      const res = await fetch(`${API}/${task.id}`, { method: "DELETE" });
      const { message } = await res.json();
      console.log(message);

      loadTasks();
    } catch (error) {
      console.error("削除に失敗したよ:", error);
    }
  };
  /*
  const deleteAllTasks = async () => {
    if (!confirm("本当に一括削除しますか？")) return;
    if (!confirm("本当の本当に一括削除しますか？")) return;

    try {
      const res = await fetch(`${API}/all`, { method: "DELETE" });
      const { message } = await res.json();
      console.log(message);
      loadTasks();
    } catch (error) {
      console.error("一括削除中にエラーが発生したよ:", error);
    }
  };
  */
  const deleteAllTasksTrigger = () => {
    if (!confirm("本当に一括削除しますか？")) return;
    if (!confirm("本当の本当に一括削除しますか？")) return;
    // 2回の確認をパスしたらモーダルを表示
    setShowDeleteModal(true);
  };

  const executeDeleteAll = async () => {
    if (deleteConfirmText !== "タスクを一括削除する") {
      alert("入力された文字が正しくないよ！");
      return;
    }

    try {
      const res = await fetch(`${API}/all`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmText: deleteConfirmText }),
      });
      const { message } = await res.json();
      console.log(message);
      loadTasks();
      setShowDeleteModal(false); // モーダルを閉じる
      setDeleteConfirmText(""); // テキストをリセット
    } catch (error) {
      console.error("一括削除中にエラーが発生したよ:", error);
    }
  };

  //初回読み込み.
  useEffect(() => {
    loadTasks();
  }, []);

  //期限の表示変更
  const formatDateJP = (dateString) => {
    if (!dateString) return "なし";

    const date = new Date(dateString);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${y}/${m}/${d} ${h}:${min}`;
  };

  //ソート
  const sortTasks = () => {
    if (sortType === "default") {
      loadTasks();
      return;
    }

    const now = new Date();

    // 元の順序保持用 index 付与
    const tasksWithIndex = tasks.map((t, i) => ({ ...t, index: i }));

    // ソート可能・不可能で分離
    const sortable = [];
    const unsortable = [];

    for (const task of tasksWithIndex) {
      if (sortType === "urgent") {
        if (task.due_date) {
          sortable.push(task);
        } else {
          unsortable.push(task);
        }
      } else if (sortType === "priority") {
        if (task.priority) {
          sortable.push(task);
        } else {
          unsortable.push(task);
        }
      } else if (sortType === "mix") {
        if (task.due_date && task.priority) {
          sortable.push(task);
        } else {
          unsortable.push(task);
        }
      }
    }

    // ソート
    sortable.sort((a, b) => {
      const now = new Date(); // 基準時間を比較のたびに取得

      // 緊急度順
      if (sortType === "urgent") {
        const dateA = new Date(a.due_date);
        const dateB = new Date(b.due_date);
        if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
        return (b.priority || 0) - (a.priority || 0);
      }

      // 重要度順
      if (sortType === "priority") {
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }

      // 緊急度×重要度順
      if (sortType === "mix") {
        const sA = getScore((new Date(a.due_date) - now) / 1000, a.priority);
        const sB = getScore((new Date(b.due_date) - now) / 1000, b.priority);
        // scoreB - scoreA で降順（スコアが高い順）を「外側のsort」に返す
        return sB - sA;
      }

      return 0;
    });

    // 結合（unsortableは元順）
    setTasks([...sortable, ...unsortable.sort((a, b) => a.index - b.index)]);
  };

  const convertToNumber = (value) => {
    if (value === "") {
      return null;
    }
    return Number(value);
  };

  const getTaskColor = (task) => {
    if (!task.due_date) return "";

    const now = new Date();
    const due = new Date(task.due_date);

    // 残り時間（時間単位）
    const diffHours = (due - now) / (1000 * 60 * 60);

    const warningHours = warningThreshold * 24;
    const safeHours = safeThreshold * 24 * 7;

    // 赤（<= urgent）
    if (diffHours <= urgentThreshold) {
      return "red";
    }

    // 黄（<= warning）
    if (diffHours <= warningHours) {
      return "yellow";
    }

    // 緑（<= safe）
    if (diffHours <= safeHours) {
      return "green";
    }

    return "";
  };

  const getBackgroundColor = (color) => {
    switch (color) {
      case "red":
        return "#ffe5e5";
      case "yellow":
        return "#fff9cc";
      case "green":
        return "#e5ffe5";
      default:
        return "transparent";
    }
  };

  const getScore = (diffSeconds, priority) => {
    const maxSeconds = safeThreshold * 7 * 24 * 3600; // 緑の上限

    // 期限（小さいほど良い → 逆転させる）
    const timeScore = 1 - Math.min(diffSeconds / maxSeconds, 1);

    // 重要度（1〜5 → 0〜1）
    const priorityScore = (priority - 1) / 4;

    // 同じ重みで足す
    return timeScore + priorityScore;
  };

  return (
    <div>
      <h1>ToDo リスト</h1>
      <div>
        <input
          type="text"
          value={addedTask}
          onChange={(e) => setAddedTask(e.target.value)}
          placeholder="追加するタスク"
        />
        <input
          type="datetime-local"
          value={addedDueDate}
          onChange={(e) => setAddedDueDate(e.target.value)}
        />
        <select
          value={addedPriority ?? ""}
          onChange={(e) => setAddedPriority(convertToNumber(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={4}>4</option>
          <option value={3}>3</option>
          <option value={2}>2</option>
          <option value={1}>1</option>
          <option value={""}>なし</option>
        </select>
        <button onClick={addTask}>タスク追加</button>
      </div>

      <div>
        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="default">追加順</option>
          <option value="urgent">緊急度順</option>
          <option value="priority">重要度順</option>
          <option value="mix">緊急度×重要度順</option>
        </select>
        で<button onClick={sortTasks}>ソート</button>
      </div>

      <div>
        色分け: 赤 (
        <select
          value={urgentThreshold}
          onChange={(e) => setUrgentThreshold(Number(e.target.value))}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option value={i + 1}>{i + 1}</option>
          ))}
        </select>
        )時間以内 / 黄 (
        <select
          value={warningThreshold}
          onChange={(e) => setWarningThreshold(Number(e.target.value))}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <option value={i + 1}>{i + 1}</option>
          ))}
        </select>
        )日以内 / 緑 (
        <select
          value={safeThreshold}
          onChange={(e) => setSafeThreshold(Number(e.target.value))}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <option value={i + 1}>{i + 1}</option>
          ))}
        </select>
        )週以内
      </div>
      {/*
      <div>
        全件操作:
        <button onClick={deleteAllTasks}>一括削除</button>
      </div>
      */}
      <div style={{ marginTop: "10px" }}>
        全件操作:
        <button
          onClick={deleteAllTasksTrigger}
          style={{ color: "white", backgroundColor: "red" }}
        >
          一括削除
        </button>
      </div>

      <hr />

      {tasks.map((task) => {
        const color = getTaskColor(task);
        return (
          <div
            key={task.id}
            style={{
              marginBottom: "10px",
              backgroundColor: getBackgroundColor(color),
            }}
          >
            {/*チェックボックス*/}
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => {
                toggleDone(task);
              }}
            />

            {/*編集モードかどうか*/}
            {editingId === task.id ? (
              <>
                <input
                  type="text"
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                />
                <input
                  type="datetime-local"
                  value={editingDueDate}
                  onChange={(e) => setEditingDueDate(e.target.value)}
                />
                <select
                  value={editingPriority ?? ""}
                  onChange={(e) =>
                    setEditingPriority(convertToNumber(e.target.value))
                  }
                >
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                  <option value={""}>なし</option>
                </select>

                <button onClick={() => saveEdit(task)}>保存</button>
              </>
            ) : (
              <>
                <span
                  style={{
                    textDecoration: task.done ? "line-through" : "none",
                    marginRight: "10px",
                  }}
                >
                  {task.content}
                </span>
                <span style={{ marginRight: "10px" }}>
                  期限:{formatDateJP(task.due_date) || "なし"}
                </span>
                <span style={{ marginRight: "10px" }}>
                  重要度:{task.priority || "なし"}
                </span>
                <button onClick={() => startEdit(task)}>編集</button>
              </>
            )}

            {/*削除ボタン*/}
            <button onClick={() => deleteTask(task)}>削除</button>
          </div>
        );
      })}

      {/* --- 追加した三段階目の確認ダイアログ (モーダル) --- */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ color: "red" }}>最終確認</h2>
            <p>
              本当に全てのタスクを消去しますか？
              <br />
              実行するには<strong>「タスクを一括削除する」</strong>
              と入力してください。
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="ここに文字を入力"
              style={{ padding: "8px", width: "80%", marginBottom: "20px" }}
            />
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
              >
                キャンセル
              </button>
              <button
                onClick={executeDeleteAll}
                style={{ backgroundColor: "red", color: "white" }}
                disabled={deleteConfirmText !== "タスクを一括削除する"}
              >
                完全に削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
