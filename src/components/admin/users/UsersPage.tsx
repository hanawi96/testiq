import React from 'react';
import UsersList from './UsersList';
import UsersByCountry from './UsersByCountry';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Users List */}
      <UsersList />

      {/* Users by Country - Bottom Box */}
      <UsersByCountry />
    </div>
  );
}
