import React from 'react';
import type { UsersListResponse } from '../../../../../backend';
import { QuickRoleEditor, QuickVerificationEditor, UserAvatar, CountryFlag, GenderDisplay } from './index';
import { SkeletonTableRow } from './SkeletonComponents';
import { formatDate, formatTestCount, getRoleBadge, getUserTypeBadge, isAnonymousUser } from '../utils/formatters';

interface Props {
  usersData: UsersListResponse | null;
  isLoading: boolean;
  selectedUsers: string[];
  actionLoading: string;
  onUserSelect: (userId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onRoleUpdate: (userId: string, newRole: string) => void;
  onVerificationToggle: (userId: string) => Promise<void>;
  onEditUser: (userId: string) => void;
  onEditHover: () => void;
  onDeleteUser: (userId: string) => void;
}

export default function UsersTable({
  usersData,
  isLoading,
  selectedUsers,
  actionLoading,
  onUserSelect,
  onSelectAll,
  onRoleUpdate,
  onVerificationToggle,
  onEditUser,
  onEditHover,
  onDeleteUser
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Icon với background màu xanh */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Danh sách người dùng
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Quản lý thông tin người dùng và phân quyền
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length > 0 && selectedUsers.length === usersData?.users.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span>Người dùng</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quốc gia
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Giới tính
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tuổi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Số lần test IQ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ngày tham gia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Đăng nhập cuối
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {/* Real users */}
            {usersData?.users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {/* User Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {/* Checkbox - for all users */}
                    <div className="flex-shrink-0 mr-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => onUserSelect(user.id, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>
                    <div className="flex-shrink-0 mr-4">
                      <UserAvatar user={user} size="md" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username || user.full_name}</div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getUserTypeBadge(user.user_type)}`}>
                          {user.user_type === 'anonymous' ? 'Chưa đăng ký' : 'Đã đăng ký'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {isAnonymousUser(user) ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                      Chưa đăng ký
                    </span>
                  ) : (
                    <QuickRoleEditor
                      userId={user.id}
                      currentRole={user.role as 'admin' | 'editor' | 'author' | 'reviewer' | 'user' | 'mod'}
                      onRoleUpdate={onRoleUpdate}
                      isLoading={actionLoading === `role-${user.id}`}
                      disabled={false}
                    />
                  )}
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {isAnonymousUser(user) ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Không áp dụng
                    </span>
                  ) : (
                    <QuickVerificationEditor
                      userId={user.id}
                      userName={user.username || user.full_name}
                      currentStatus={user.is_verified}
                      onStatusUpdate={onVerificationToggle}
                      isLoading={actionLoading === `verify-${user.id}`}
                    />
                  )}
                </td>

                {/* Country */}
                <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                  {user.country_name ? (
                    <div className="flex items-center space-x-2">
                      {/* Flag */}
                      <div className="flex-shrink-0">
                        <CountryFlag
                          countryName={user.country_name}
                          countryCode={user.country_code}
                          size="md"
                        />
                      </div>
                      {/* Country name */}
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {user.country_name}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Chưa có</span>
                  )}
                </td>

                {/* Gender */}
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <GenderDisplay gender={user.gender} />
                </td>

                {/* Age */}
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {user.age ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                      {user.age} tuổi
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Chưa có</span>
                  )}
                </td>

                {/* Test Count */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {(() => {
                    const { text, className } = formatTestCount(user.test_count);
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
                        {text}
                      </span>
                    );
                  })()}
                </td>

                {/* Join Date */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(user.created_at)}
                </td>

                {/* Last Login */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.last_sign_in_at)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => onEditUser(user.id)}
                      onMouseEnter={onEditHover}
                      className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Sửa thông tin"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      disabled={actionLoading === `delete-${user.id}`}
                      className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Xóa người dùng"
                    >
                      {actionLoading === `delete-${user.id}` ? (
                        <div className="w-4 h-4 border border-current border-r-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Skeleton rows while loading */}
            {isLoading && !usersData?.users?.length && (
              <>
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
              </>
            )}
          </tbody>
        </table>

        {/* Empty State */}
        {!isLoading && usersData?.users.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có người dùng nào</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
          </div>
        )}
      </div>
    </div>
  );
}

