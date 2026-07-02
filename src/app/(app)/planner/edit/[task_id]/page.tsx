'use client'

import { useParams } from 'next/navigation'
import { TaskForm } from '@/modules/planner/components/TaskForm'

export default function EditTaskPage() {
  const params = useParams()
  const taskId = params.task_id as string
  return <TaskForm taskId={taskId} />
}
