import Header from "@/components/dashboard/header";
import TableBlock from "@/components/blocks/table";
import { Table as TableSlotType } from "@/types/slots/table";
import Toolbar from "@/components/blocks/toolbar";

export default function ({ ...table }: TableSlotType) {
  return (
    <>
      <Header crumb={table.crumb} />
      <div className="w-full px-4 md:px-8 py-8">
        <h1 className="text-2xl font-medium mb-8">{table.title}</h1>
        {table.description && (
          <p className="text-sm text-muted-foreground mb-8">
            {table.description}
          </p>
        )}
        {table.tip && (
          <p className="text-sm text-muted-foreground mb-8">
            {table.tip.description || table.tip.title}
          </p>
        )}
        {table.toolbar && <Toolbar items={table.toolbar.items} />}
        {table.groups && table.groups.length > 0 ? (
          <div className="space-y-12">
            {table.groups.map((group, index) => (
              <div key={`${group.title}-${index}`}>
                <h2 className="mb-4 text-lg font-medium text-foreground">{group.title}</h2>
                <div className="overflow-x-auto">
                  <TableBlock
                    columns={table.columns}
                    data={group.data}
                    empty_message={group.empty_message ?? table.empty_message ?? "暂无数据"}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableBlock
              columns={table.columns}
              data={table.data}
              empty_message={table.empty_message}
            />
          </div>
        )}
      </div>
    </>
  );
}
