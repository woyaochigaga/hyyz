import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getUsers } from "@/models/user";
import moment from "moment";
import { proxifyAvatarUrl } from "@/lib/avatar";
import { DeleteUserButton } from "@/components/admin/users/delete-user-button";

export default async function () {
  const users = await getUsers(1, 50);

  const columns: TableColumn[] = [
    { name: "uuid", title: "UUID" },
    { name: "email", title: "邮箱" },
    { name: "nickname", title: "昵称" },
    { name: "role", title: "角色" },
    {
      name: "avatar_url",
      title: "头像",
      callback: (row) => (
        <img
          src={proxifyAvatarUrl(row.avatar_url)}
          className="w-10 h-10 rounded-full"
        />
      ),
    },
    {
      name: "created_at",
      title: "创建时间",
      callback: (row) => moment(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "操作",
      className: "text-right",
      callback: (row) => (
        <div className="flex justify-end">
          <DeleteUserButton uuid={row.uuid} label={row.email || row.nickname} />
        </div>
      ),
    },
  ];

  const table: TableSlotType = {
    title: "全部用户",
    columns,
    data: users,
  };

  return <TableSlot {...table} />;
}
