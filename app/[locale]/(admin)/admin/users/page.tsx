import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getAllUsers } from "@/models/user";
import type { User } from "@/types/user";
import moment from "moment";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { DeleteUserButton } from "@/components/admin/users/delete-user-button";

function roleLabel(role: User["role"] | undefined): string {
  if (role === "admin") return "管理员";
  if (role === "artisan") return "匠人";
  return "普通用户";
}

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  const admins = users.filter((u) => u.role === "admin");
  const artisans = users.filter((u) => u.role === "artisan");
  const regular = users.filter((u) => u.role !== "admin" && u.role !== "artisan");

  const columns: TableColumn[] = [
    { name: "uuid", title: "UUID" },
    { name: "email", title: "邮箱" },
    { name: "nickname", title: "昵称" },
    {
      name: "role",
      title: "角色",
      callback: (row: User) => roleLabel(row.role),
    },
    {
      name: "avatar_url",
      title: "头像",
      callback: (row: User) => (
        <img src={proxifyAvatarUrl(row.avatar_url)} className="h-10 w-10 rounded-full" alt="" />
      ),
    },
    {
      name: "created_at",
      title: "创建时间",
      callback: (row: User) => moment(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "操作",
      className: "text-right",
      callback: (row: User) => (
        <div className="flex justify-end">
          {row.uuid ? (
            <DeleteUserButton uuid={row.uuid} label={row.email || row.nickname} />
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      ),
    },
  ];

  const table: TableSlotType = {
    title: "用户管理",
    description: `共 ${users.length} 位用户（管理员 ${admins.length}、匠人 ${artisans.length}、普通用户 ${regular.length}）`,
    columns,
    empty_message: "暂无用户",
    groups: [
      { title: "管理员", data: admins, empty_message: "暂无管理员" },
      { title: "匠人", data: artisans, empty_message: "暂无匠人" },
      { title: "普通用户", data: regular, empty_message: "暂无普通用户" },
    ],
  };

  return <TableSlot {...table} />;
}
