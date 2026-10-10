"use client";

import { Card, CardContent } from "@/components/ui/card";
import TaskForm from "@/components/dashboard/TaskForm";

export default function NewTaskPage({
  users
}: {
  users: { id: number; nombre: string; rolFamiliar: string; fotoUrl?: string | null }[]
}) {
  return (
    <div className="flex justify-center p-4 sm:p-6">
      <Card className="w-full max-w-2xl">
        <CardContent>
          <TaskForm users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
