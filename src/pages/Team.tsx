
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
  Mail, 
  MoreHorizontal,
  Users,
  Calendar,
  Star
} from 'lucide-react';

const Team = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const teamMembers = [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      role: 'Project Manager',
      department: 'Engineering',
      initials: 'AJ',
      status: 'Active',
      joinDate: '2023-01-15',
      projects: ['Website Redesign', 'Mobile App'],
      tasksCompleted: 45,
      rating: 4.8
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob.smith@company.com',
      role: 'Senior Developer',
      department: 'Engineering',
      initials: 'BS',
      status: 'Active',
      joinDate: '2022-08-20',
      projects: ['Website Redesign', 'API Documentation'],
      tasksCompleted: 67,
      rating: 4.9
    },
    {
      id: 3,
      name: 'Carol Davis',
      email: 'carol.davis@company.com',
      role: 'Database Administrator',
      department: 'Engineering',
      initials: 'CD',
      status: 'Active',
      joinDate: '2023-03-10',
      projects: ['Database Migration', 'Security Audit'],
      tasksCompleted: 32,
      rating: 4.7
    },
    {
      id: 4,
      name: 'David Wilson',
      email: 'david.wilson@company.com',
      role: 'DevOps Engineer',
      department: 'Engineering',
      initials: 'DW',
      status: 'Active',
      joinDate: '2022-11-05',
      projects: ['Database Migration', 'Security Audit'],
      tasksCompleted: 28,
      rating: 4.6
    },
    {
      id: 5,
      name: 'Eve Brown',
      email: 'eve.brown@company.com',
      role: 'UX Designer',
      department: 'Design',
      initials: 'EB',
      status: 'Active',
      joinDate: '2023-05-18',
      projects: ['Website Redesign', 'Mobile App'],
      tasksCompleted: 39,
      rating: 4.8
    },
    {
      id: 6,
      name: 'Frank Miller',
      email: 'frank.miller@company.com',
      role: 'Frontend Developer',
      department: 'Engineering',
      initials: 'FM',
      status: 'Away',
      joinDate: '2023-02-14',
      projects: ['Website Redesign'],
      tasksCompleted: 23,
      rating: 4.5
    },
    {
      id: 7,
      name: 'Grace Lee',
      email: 'grace.lee@company.com',
      role: 'QA Tester',
      department: 'Quality Assurance',
      initials: 'GL',
      status: 'Active',
      joinDate: '2023-04-22',
      projects: ['Mobile App', 'Security Audit'],
      tasksCompleted: 51,
      rating: 4.9
    },
    {
      id: 8,
      name: 'Henry Chen',
      email: 'henry.chen@company.com',
      role: 'Technical Writer',
      department: 'Documentation',
      initials: 'HC',
      status: 'Active',
      joinDate: '2022-12-01',
      projects: ['API Documentation'],
      tasksCompleted: 19,
      rating: 4.7
    }
  ];

  const getRoleColor = (role: string) => {
    const roleColors = {
      'Project Manager': 'bg-purple-100 text-purple-800',
      'Senior Developer': 'bg-blue-100 text-blue-800',
      'Database Administrator': 'bg-green-100 text-green-800',
      'DevOps Engineer': 'bg-orange-100 text-orange-800',
      'UX Designer': 'bg-pink-100 text-pink-800',
      'Frontend Developer': 'bg-cyan-100 text-cyan-800',
      'QA Tester': 'bg-yellow-100 text-yellow-800',
      'Technical Writer': 'bg-indigo-100 text-indigo-800'
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Away': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
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
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Team Management</h1>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Projects in progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7</div>
              <p className="text-xs text-muted-foreground">Team performance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">304</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <Card 
              key={member.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-white"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-lg font-semibold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {member.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Role and Status */}
                <div className="flex items-center justify-between">
                  <Badge className={getRoleColor(member.role)}>
                    {member.role}
                  </Badge>
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Department */}
                <div>
                  <span className="text-sm font-medium text-gray-700">Department: </span>
                  <span className="text-sm text-gray-600">{member.department}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-gray-900">{member.tasksCompleted}</div>
                    <div className="text-xs text-gray-500">Tasks Completed</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-lg font-bold text-gray-900">{member.rating}</span>
                    </div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Current Projects</div>
                  <div className="flex flex-wrap gap-1">
                    {member.projects.slice(0, 2).map((project) => (
                      <Badge key={project} variant="outline" className="text-xs">
                        {project}
                      </Badge>
                    ))}
                    {member.projects.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.projects.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Join Date */}
                <div className="text-xs text-gray-500 border-t pt-3">
                  Joined {new Date(member.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by inviting team members'}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;
