import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getPaiedOrders } from "@/models/order";
import moment from "moment";

export default async function () {
  const orders = await getPaiedOrders(1, 50);

  const columns: TableColumn[] = [
    { name: "order_no", title: "订单号" },
    { name: "paid_email", title: "支付邮箱" },
    { name: "product_name", title: "商品名称" },
    { name: "amount", title: "金额" },
    {
      name: "created_at",
      title: "创建时间",
      callback: (row) => moment(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const table: TableSlotType = {
    title: "已支付订单",
    columns,
    data: orders,
  };

  return <TableSlot {...table} />;
}
