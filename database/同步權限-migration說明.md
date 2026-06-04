# Supabase 同步權限 Migration

先跑過 `database/supabase-schema.sql` 之後，請在 Supabase SQL Editor 再跑一次：

```text
database/supabase-migration-20260604-sync-policies.sql
```

這個 migration 不會刪除既有資料，作用是補上多角色與檔案中心權限：

- `carey`：保留主任資料可讀，同時可寫財政資料。
- `william`：保留教師資料可寫，同時可寫總務庫存。
- `messages`：支援寄給個人，也支援寄給角色群組。
- `messages`：補上刪除權限，讓檔案中心刪除/清除已讀能同步。

跑完後可以在 Supabase Table Editor 檢查 `user_roles`：

```text
mark    主任
carey   主任 / 財政
william 教師 / 總務
```
