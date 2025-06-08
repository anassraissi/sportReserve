
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Kanban, Users, Settings, Plus, Calendar, BarChart3 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [user] = useState({ name: 'John Doe', role: 'Project Manager' }); // Mock user

  const projects = [
    { id: 1, name: 'Website Redesign', status: 'In Progress', tasks: 12, members: 5, deadline: '2024-07-15' },
    { id: 2, name: 'Mobile App Development', status: 'Planning', tasks: 8, members: 3, deadline: '2024-08-20' },
    { id: 3, name: 'Database Migration', status: 'Review', tasks: 6, members: 2, deadline: '2024-06-30' },
  ];

  const recentActivity = [
    { id: 1, action: 'Task "Design Homepage" moved to Done', time: '2 hours ago', user: 'Alice Johnson' },
    { id: 2, action: 'New project "E-commerce Platform" created', time: '4 hours ago', user: 'Bob Smith' },
    { id: 3, action: 'Comment added to "User Authentication"', time: '6 hours ago', user: 'Carol Davis' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Kanban className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">KanbanPro</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome back, {user.name}</span>
              <Badge variant="secondary">{user.role}</Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Kanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">86</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 new this month</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">+5% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects Section */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your latest project activities</CardDescription>
                </div>
                <Button onClick={() => navigate('/kanban')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/kanban')}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{project.tasks} tasks</span>
                      <span>{project.members} members</span>
                      <span>Due: {project.deadline}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={project.status === 'In Progress' ? 'default' : 'secondary'}
                    className={project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}
                  >
                    {project.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across your projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.user}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
                  onClick={() => navigate('/kanban')}
                >
                  <Kanban className="h-6 w-6" />
                  <span>Open Kanban Board</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200"
                  onClick={() => navigate('/projects')}
                >
                  <Plus className="h-6 w-6" />
                  <span>Create New Project</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200"
                  onClick={() => navigate('/team')}
                >
                  <Users className="h-6 w-6" />
                  <span>Manage Team</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
