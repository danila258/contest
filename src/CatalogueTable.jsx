import React from "react";
import {Icon, Table, Text} from "@gravity-ui/uikit";

export function CatalogueTable({label, rows, onOpen, icon, subjectLabel, columns, emptyMessage, details}) {
  return <Table aria-label={label} width="max" verticalAlign="middle" wordWrap
    data={rows} getRowDescriptor={row => ({id:row.id})} onRowClick={onOpen} emptyMessage={emptyMessage}
    columns={[
      {id:"title", name:"Название", template:row => <div className="workName">
        <button type="button" className="catalogueTitle">
          <Icon data={icon(row)}/>{row.title}
        </button>
        {subjectLabel && <Text variant="caption-2" color="secondary">{subjectLabel(row)}</Text>}
        {details?.(row)}
      </div>},
      ...columns,
    ]}/>;
}
