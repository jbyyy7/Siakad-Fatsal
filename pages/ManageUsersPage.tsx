import React from 'react';
import ImportStudents from '../components/ImportStudents';

export default function ManageUsersPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Manage Users</h2>
      <div className="mt-4">
        <ImportStudents />
      </div>
    </div>
  );
}
