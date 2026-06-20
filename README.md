# ToDo List App

## 概要
Vite + React + Express + MySQL を使用したフルスタックのToDoリストアプリです。

- タスクの作成
- タスクの一覧取得
- タスクの更新（完了状態変更、編集）
- タスクの削除

## 使用技術

### フロントエンド
- Vite
- React

### バックエンド
- Node.js
- Express

### データベース
- MySQL

## ディレクトリ構造
to-do-list-app<br>
├── client<br>
├── server<br>
├── .gitignore<br>
└── README.md<br>

## 利用方法
### 1. クローン
git clone https://github.com/yutauesaka/ToDoListApp.git

### 2. フロントエンド
npm create vite@latest client<br>
framework:react<br>
variant:Javascript<br>
use Vita:No<br>
Install npm start:Yes<br>
cd client<br>
(npm install)<br>
npm run dev<br>

### 3. バックエンド
mkdir server<br>
cd server<br>
npm init -y<br>
npm install express cors mysql2<br>
(npm install)<br>
node server.js<br>

## 環境変数

server フォルダに .env を作成

DB_HOST=localhost<br>
DB_USER=your_user<br>
DB_PASSWORD=your_password<br>
DB_NAME=your_db<br>

## データベース

CREATE DATABASE your_db;

## 開発について

### 苦戦したこと
緊急度×重要度順のソートで、うまく両方の指標を対等に評価し、総合的な優先度に基づいて並べ替えること

### 解決方法
両方とも正規化を行い、0~1に直してから足し算することで、対等に評価したソートが行えるようになった