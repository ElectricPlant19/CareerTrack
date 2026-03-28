import React, { useState } from 'react';
import { Application, ApplicationStatus, UserProfile } from '../types';
import { db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { MoreVertical, Calendar, Plus } from 'lucide-react';
import { motion } from 'motion/react';

const STAGES: ApplicationStatus[] = ['Bookmarked', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Archived'];

const STAGE_COLORS: Record<ApplicationStatus, string> = {
  'Bookmarked': 'bg-gray-100 text-gray-600',
  'Applied': 'bg-blue-100 text-blue-600',
  'Phone Screen': 'bg-indigo-100 text-indigo-600',
  'Interview': 'bg-purple-100 text-purple-600',
  'Offer': 'bg-green-100 text-green-600',
  'Rejected': 'bg-red-100 text-red-600',
  'Archived': 'bg-gray-200 text-gray-500'
};

const ApplicationCard = ({
  app,
  onStatusChange,
  onDragStart
}: {
  app: Application;
  onStatusChange: (status: ApplicationStatus) => void;
  onDragStart: (appId: string) => void;
}) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    draggable
    onDragStart={() => onDragStart(app.id)}
    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 group"
  >
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-sm truncate pr-2">{app.position}</h4>
      <button className="text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreVertical size={16} />
      </button>
    </div>
    <p className="text-xs text-gray-500 font-medium mb-3">{app.companyName}</p>
    
    <div className="flex flex-wrap gap-1 mb-4">
      {app.tags.slice(0, 2).map(tag => (
        <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
          {tag}
        </span>
      ))}
      {app.tags.length > 2 && (
        <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100">
          +{app.tags.length - 2}
        </span>
      )}
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
      <div className="flex items-center gap-1.5 text-gray-400">
        <Calendar size={12} />
        <span className="text-[10px] font-medium">
          {new Date(app.applicationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="flex -space-x-2">
        <div className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[8px] font-bold">
          {app.source?.[0] || '?'}
        </div>
      </div>
    </div>
    <div className="mt-3">
      <select
        value={app.status}
        onChange={(e) => onStatusChange(e.target.value as ApplicationStatus)}
        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5"
      >
        {STAGES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  </motion.div>
);

export default function KanbanBoard({ user, applications }: { user: UserProfile, applications: Application[] }) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicationStatus | null>(null);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    const currentApp = applications.find((app) => app.id === appId);
    if (!currentApp || currentApp.status === newStatus) return;

    try {
      await updateDoc(doc(db, `users/${user.uid}/applications`, appId), {
        companyName: currentApp.companyName,
        position: currentApp.position,
        source: currentApp.source || '',
        status: newStatus,
        applicationDate: currentApp.applicationDate,
        salary: currentApp.salary || '',
        benefits: currentApp.benefits || '',
        notes: currentApp.notes || '',
        tags: currentApp.tags || [],
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/applications/${appId}`);
    }
  };

  const handleDropOnStage = async (stage: ApplicationStatus) => {
    if (!draggedAppId) return;
    await handleStatusChange(draggedAppId, stage);
    setDraggedAppId(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide">
      {STAGES.filter(s => s !== 'Archived').map(stage => (
        <div key={stage} className="flex-shrink-0 w-72">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">{stage}</h3>
              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {applications.filter(a => a.status === stage).length}
              </span>
            </div>
            <button className="text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-lg">
              <Plus size={16} />
            </button>
          </div>
          
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => {
              if (dragOverStage === stage) setDragOverStage(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDropOnStage(stage);
            }}
            className={`min-h-[500px] bg-gray-50/50 rounded-3xl p-3 border border-dashed transition-colors ${
              dragOverStage === stage ? 'border-black bg-gray-100/70' : 'border-gray-200'
            }`}
          >
            {applications
              .filter(app => app.status === stage)
              .map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onStatusChange={(newStatus) => handleStatusChange(app.id, newStatus)}
                  onDragStart={(appId) => setDraggedAppId(appId)}
                />
              ))}
            
            {applications.filter(a => a.status === stage).length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                <p className="text-xs font-medium">No applications</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
