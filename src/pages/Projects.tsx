
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  BarChart3,
  MoreHorizontal,
  Kanban as KanbanIcon
} from 'lucide-react';

const Projects = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const projects = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design and improved UX',
      status: 'In Progress',
      progress: 65,
      members: [
        { id: 1, name: 'Alice Johnson', initials: 'AJ' },
        { id: 2, name: 'Bob Smith', initials: 'BS' },
        { id: 3, name: 'Carol Davis', initials: 'CD' }
      ],
      tasks: { total: 24, completed: 16 },
      deadline: '2024-07-15',
      priority: 'High'
    },
    {
      id: 2,
      name: 'Mobile App Development',
      description: 'Native mobile application for iOS and Android platforms',
      status: 'Planning',
      progress: 15,
      members: [
        { id: 4, name: 'David Wilson', initials: 'DW' },
        { id: 5, name: 'Eve Brown', initials: 'EB' }
      ],
      tasks: { total: 32, completed: 5 },
      deadline: '2024-09-30',
      priority: 'Medium'
    },
    {
      id: 3,
      name: 'Database Migration',
      description: 'Migrate legacy database to modern cloud infrastructure',
      status: 'Review',
      progress: 90,
      members: [
        { id: 6, name: 'Frank Miller', initials: 'FM' },
        { id: 7, name: 'Grace Lee', initials: 'GL' }
      ],
      tasks: { total: 12, completed: 11 },
      deadline: '2024-06-30',
      priority: 'High'
    },
    {
      id: 4,
      name: 'API Documentation',
      description: 'Comprehensive documentation for all API endpoints',
      status: 'Completed',
      progress: 100,
      members: [
        { id: 8, name: 'Henry Chen', initials: 'HC' }
      ],
      tasks: { total: 8, completed: 8 },
      deadline: '2024-05-20',
      priority: 'Low'
    },
    {
      id: 5,
      name: 'E-commerce Platform',
      description: 'Build a scalable e-commerce solution with payment integration',
      status: 'Not Started',
      progress: 0,
      members: [],
      tasks: { total: 45, completed: 0 },
      deadline: '2024-11-15',
      priority: 'Medium'
    },
    {
      id: 6,
      name: 'Security Audit',
      description: 'Comprehensive security review and penetration testing',
      status: 'In Progress',
      progress: 40,
      members: [
        { id: 9, name: 'Ivy Thompson', initials: 'IT' },
        { id: 10, name: 'Jack Brown', initials: 'JB' }
      ],
      tasks: { total: 18, completed: 7 },
      deadline: '2024-08-10',
      priority: 'High'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Review': return 'bg-yellow-100 text-yellow-800';
      case 'Planning': return 'bg-purple-100 text-purple-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <h1 className="text-xl font-bold text-gray-900">Projects</h1>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-white"
              onClick={() => navigate('/kanban')}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status and Priority */}
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="flex items-center justify-center text-gray-400">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {project.tasks.completed}/{project.tasks.total}
                    </div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center text-gray-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {project.members.length}
                    </div>
                    <div className="text-xs text-gray-500">Members</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center text-gray-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500">Due</div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Team</span>
                  </div>
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 4).map((member) => (
                      <Avatar key={member.id} className="w-8 h-8 border-2 border-white">
                        <AvatarFallback className="text-xs">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.members.length > 4 && (
                      <Avatar className="w-8 h-8 border-2 border-white">
                        <AvatarFallback className="text-xs">
                          +{project.members.length - 4}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {project.members.length === 0 && (
                      <div className="text-sm text-gray-500">No members assigned</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <KanbanIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first project'}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
