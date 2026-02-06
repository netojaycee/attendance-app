"use client"
import * as React from "react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Filter, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, row: T, rowIndex: number) => React.ReactNode;
  className?: string;
  searchable?: boolean;
}

interface CustomTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  className?: string;
  tableTitle?: string;
  tableSubtitle?: string;
  searchPlaceholder?: string;
  display?: {
    searchComponent?: boolean;
    filterComponent?: boolean;
    statusComponent?: boolean;
    methodsComponent?: boolean;
    exportButton?: boolean;
  };
  statusOptions?: string[];
  methodsOptions?: string[];
  loading?: boolean;
}

export function CustomTable<T extends { [key: string]: any }>({
  columns,
  data,
  pageSize = 10,
  className,
  tableTitle,
  tableSubtitle,
  searchPlaceholder,
  display: {
    searchComponent = true,
    filterComponent = false,
    statusComponent = false,
    methodsComponent = false,
    exportButton = false,
  } = {},
  statusOptions = [],
  methodsOptions = [],
  loading = false,
}: CustomTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter((row) =>
      columns.some((col) => {
        if (col.searchable === false) return false;
        const value = row[col.key];
        return (
          value && value.toString().toLowerCase().includes(search.toLowerCase())
        );
      })
    );
  }, [search, data, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = useMemo(
    () => filteredData.slice((page - 1) * pageSize, page * pageSize),
    [filteredData, page, pageSize]
  );

  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <div className={cn("w-full bg-white p-4 rounded-2xl shadow-md", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-normal text-base">{tableTitle}</h2>
          {tableSubtitle && (
            <p className="text-sm text-gray-500">{tableSubtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {searchComponent && (
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <Input
                placeholder={searchPlaceholder || "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-66 bg-gray-100 rounded-2xl placeholder:text-xs"
              />
            </div>
          )}
          {statusComponent && (
            // select component for status filter
            <Select
              onValueChange={(_value: any) => {
                // handle status change here, e.g., set a state
              }}
              defaultValue={statusOptions[0] || ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {methodsComponent && (
            // select component for status filter
            <Select
              onValueChange={(_value: any) => {
                // handle status change here, e.g., set a state
              }}
              defaultValue={methodsOptions[0] || ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {methodsOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterComponent && (
            <Button variant="outline" className="rounded-2xl">
              <Filter /> Filter
            </Button>
          )}
          {exportButton && (
            <Button variant="outline" className="rounded-2xl">
              <Download /> Export
            </Button>
          )}
          {/* Pagination Controls */}
          {/* <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Prev
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
            Next
          </Button>
        </div> */}
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2 text-left font-semibold text-gray-700",
                    col.className
                  )}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-2", col.className)}
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-400"
                >
                  No data found
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-2", col.className)}
                    >
                      {col.render
                        ? col.render(row[col.key], row, rowIndex)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
