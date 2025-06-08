
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Kanban as KanbanIcon, 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  MessageSquare, 
  Paperclip,
  Flag
} from 'lucide-react';

const Kanban = () => {
  const navigate = useNavigate();
  
  const [columns] = useState([
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'inprogress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ]);

  const [tasks] = useState([
    {
      id: '1',
      title: 'Design Homepage Layout',
      description: 'Create wireframes and mockups for the new homepage',
      column: 'todo',
      priority: 'high',
      assignee: { name: 'Alice Johnson', avatar: '', initials: 'AJ' },
      dueDate: '2024-06-15',
      comments: 3,
      attachments: 2,
      tags: ['Design', 'Frontend']
    },
    {
      id: '2',
      title: 'Implement User Authentication',
      description: 'Set up login and registration functionality',
      column: 'inprogress',
      priority: 'medium',
      assignee: { name: 'Bob Smith', avatar: '', initials: 'BS' },
      dueDate: '2024-06-20',
      comments: 1,
      attachments: 0,
      tags: ['Backend', 'Security']
    },
    {
      id: '3',
      title: 'Database Schema Design',
      description: 'Plan and create the database structure',
      column: 'review',
      priority: 'high',
      assignee: { name: 'Carol Davis', avatar: '', initials: 'CD' },
      dueDate: '2024-06-10',
      comments: 5,
      attachments: 1,
      tags: ['Database', 'Planning']
    },
    {
      id: '4',
      title: 'Setup CI/CD Pipeline',
      description: 'Configure automated deployment process',
      column: 'done',
      priority: 'low',
      assignee: { name: 'David Wilson', avatar: '', initials: 'DW' },
      dueDate: '2024-06-05',
      comments: 2,
      attachments: 3,
      tags: ['DevOps', 'Automation']
    },
    {
      id: '5',
      title: 'API Documentation',
      description: 'Write comprehensive API documentation',
      column: 'todo',
      priority: 'medium',
      assignee: { name: 'Eve Brown', avatar: '', initials: 'EB' },
      dueDate: '2024-06-25',
      comments: 0,
      attachments: 0,
      tags: ['Documentation', 'API']
    },
    {
      id: '6',
      title: 'Mobile Responsiveness',
      description: 'Ensure the app works well on mobile devices',
      column: 'inprogress',
      priority: 'high',
      assignee: { name: 'Frank Miller', avatar: '', initials: 'FM' },
      dueDate: '2024-06-18',
      comments: 4,
      attachments: 2,
      tags: ['Frontend', 'Mobile']
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(task => task.column === columnId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <KanbanIcon className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Website Redesign Project</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                <Avatar className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className="text-xs">AJ</AvatarFallback>
                </Avatar>
                <Avatar className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className="text-xs">BS</AvatarFallback>
                </Avatar>
                <Avatar className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className="text-xs">CD</AvatarFallback>
                </Avatar>
                <Avatar className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className="text-xs">+3</AvatarFallback>
                </Avatar>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="space-y-4">
              {/* Column Header */}
              <div className={`rounded-lg p-4 ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">{column.title}</h2>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {getTasksByColumn(column.id).length}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {getTasksByColumn(column.id).map((task) => (
                  <Card 
                    key={task.id} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-white"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium text-gray-900 mb-1">
                            {task.title}
                          </CardTitle>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-xs px-2 py-0 h-5"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Priority & Due Date */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge 
                          className={`text-xs px-2 py-0 h-5 ${getPriorityColor(task.priority)}`}
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {task.dueDate}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {task.assignee.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          {task.comments > 0 && (
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {task.comments}
                            </div>
                          )}
                          {task.attachments > 0 && (
                            <div className="flex items-center">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {task.attachments}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kanban;
