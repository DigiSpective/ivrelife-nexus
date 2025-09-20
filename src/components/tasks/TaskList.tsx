import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from './TaskStatusBadge';
import { Task } from '@/types';
import { Calendar, User } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  className?: string;
  onTaskClick?: (task: Task) => void;
}

export function TaskList({ tasks, className = "", onTaskClick }: TaskListProps) {
  return (
    <Card className={`shadow-card ${className}`}>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
              onClick={() => onTaskClick?.(task)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {task.assigned_to || 'Unassigned'}
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <TaskStatusBadge status={task.status} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}