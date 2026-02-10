import React from "react";
import UsersManagementClient from "./UsersManagementClient";
import {
  getPendingUsersAction,
  getUsersAction,
} from "@/lib/actions/users.actions";
import { notFound } from "next/navigation";

export default async function UsersManagement() {
  const resultUsers = await getUsersAction({ status: "active" });
  const resultPendingUsers = await getPendingUsersAction();
  if (!resultPendingUsers.success || !resultPendingUsers.data) {
    notFound();
  }
  if (!resultUsers.success || !resultUsers.data) {
    notFound();
  }

  const activeUsers = resultUsers.data;
  const pendingUsers = resultPendingUsers.data;
  return (
    <UsersManagementClient
      initialActiveUsers={activeUsers}
      initialPendingUsers={pendingUsers}
    />
  );
}
