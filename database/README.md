# Supabase 正式資料庫設定

這個資料夾是正式多人共用資料庫的第一步。現在 APP 仍可用 `localStorage`，等 Supabase 建好後，再逐步把功能改成雲端讀寫。

## 1. 建立 Supabase 專案

1. 到 Supabase 建立新 project。
2. 記下 `Project URL` 與 `anon public key`。
3. 到 `SQL Editor`，貼上 `database/supabase-schema.sql`，執行。

## 2. 建立登入帳號

到 Supabase `Authentication > Users` 新增帳號。建議先建：

- `mark`：主任
- `carey`：主任或財政，可先建一個財政帳號測試
- `william`：教師

新增後，到 `profiles` 表補資料。`id` 要使用 Authentication user 的 UUID。

```sql
insert into public.profiles (id, username, display_name, role)
values
  ('AUTH_USER_UUID', 'william', 'william', '教師');
```

## 3. 前端設定

複製：

```text
shared/supabase-config.example.js
```

成為：

```text
shared/supabase-config.js
```

並填入 Supabase 專案 URL 與 anon key。正式版只能使用 anon public key，不可以放 service role key。

## 4. 改造順序

先改最核心同步功能：

1. 登入改 Supabase Auth
2. 學生資料與出缺勤改 `students`
3. 教室日誌改 `journals`
4. 主任指派改 `assignments`
5. 教師打卡與主任排班改 `shifts`
6. 財政薪資與記帳改 `payroll_adjustments`、`ledger_entries`
7. 總務備品改 `inventory_items`
8. 檔案中心改 `messages` 與 Supabase Storage

## 5. 安全原則

- 開啟 Row Level Security。
- APP 內只放 anon public key。
- 不要把 service role key 放進 GitHub、Windows APP 或網頁。
- 每個使用者必須用 Supabase Auth 登入後才能讀寫資料。
