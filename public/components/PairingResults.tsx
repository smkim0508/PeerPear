import { PairingResultData, PairedGroup, User } from '@/types/events';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, User as UserIcon, Mail, Trophy, Award } from 'lucide-react';

interface PairingResultsProps {
  pairingData: PairingResultData;
  eventId: number;
}

const getRoleIcon = (role?: string) => {
  if (role === 'BIG_SIBLING') return <Trophy className="w-4 h-4 text-yellow-600" />;
  if (role === 'LITTLE_SIBLING') return <Award className="w-4 h-4 text-blue-600" />;
  return <UserIcon className="w-4 h-4 text-gray-600" />;
};

const getRoleLabel = (role?: string) => {
  if (role === 'BIG_SIBLING') return 'Big Sibling';
  if (role === 'LITTLE_SIBLING') return 'Little Sibling';
  return 'Participant';
};

const getRoleStyle = (role?: string) => {
  if (role === 'BIG_SIBLING') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (role === 'LITTLE_SIBLING') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function PairingResults({ pairingData, eventId }: PairingResultsProps) {
  const { groups, llm_reasoning } = pairingData;

  if (!groups || groups.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-nav-dark font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Pairing Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-6">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No pairings available for this event.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-nav-dark font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Pairing Results ({groups.length} {groups.length === 1 ? 'Group' : 'Groups'})
        </CardTitle>
        {llm_reasoning && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-1 text-sm">Pairing Reasoning</h4>
            <p className="text-blue-800 text-xs leading-relaxed">{llm_reasoning}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {groups.map((group: PairedGroup, groupIndex: number) => (
            <div 
              key={groupIndex} 
              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              <h3 className="font-medium text-nav-dark mb-3 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                Group {groupIndex + 1} ({group.students.length} members)
              </h3>
              
              <div className="space-y-2">
                {group.students.map((student: User, studentIndex: number) => (
                  <div 
                    key={studentIndex}
                    className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-md"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getRoleIcon(student.role)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {student.name || `${student.first_name} ${student.last_name}`}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    
                    {student.role && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleStyle(student.role)} ml-2 whitespace-nowrap`}>
                        {getRoleLabel(student.role)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}