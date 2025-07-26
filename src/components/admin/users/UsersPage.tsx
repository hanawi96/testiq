// React import removed - not needed in React 17+
import { UsersList } from './UsersList';
import { UsersByCountry } from './components';

export const UsersPage = () => {
  return (
    <div className="space-y-6">
      {/* Users List */}
      <UsersList />

      {/* Users by Country - Bottom Box */}
      <UsersByCountry />
    </div>
  );
};
