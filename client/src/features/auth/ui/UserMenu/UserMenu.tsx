import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { Button, DropdownMenu, useToast } from '@shared/ui';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectCurrentUser, selectIsAuthenticated, logOut } from '@entities/session';
import styles from './UserMenu.module.css';

export const UserMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogout = () => {
    dispatch(logOut());
    toast({
      title: 'Logged out',
      description: 'You have been signed out of WanderFlow.',
    });
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={styles.container}>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<LogIn size={16} />}
          onClick={() => navigate('/login')}
        >
          Sign In
        </Button>
      </div>
    );
  }

  const trigger = (
    <button type="button" className={styles.avatarBtn} aria-label="User account menu">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
      ) : (
        <div className={styles.avatarFallback}>
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className={styles.userName}>{user.name}</span>
    </button>
  );

  return (
    <div className={styles.container}>
      <DropdownMenu
        trigger={trigger}
        align="end"
        items={[
          {
            key: 'user-info',
            label: (
              <div className={styles.userInfoHeader}>
                <span className={styles.menuName}>{user.name}</span>
                <span className={styles.menuEmail}>{user.email}</span>
              </div>
            ),
            disabled: true,
          },
          {
            key: 'profile',
            label: 'Profile Settings',
            icon: <UserIcon size={16} />,
            onClick: () =>
              toast({
                title: 'Account Profile',
                description: `Signed in as ${user.email} (${user.role || 'user'})`,
              }),
          },
          'separator',
          {
            key: 'logout',
            label: 'Sign Out',
            icon: <LogOut size={16} />,
            destructive: true,
            onClick: handleLogout,
          },
        ]}
      />
    </div>
  );
};
