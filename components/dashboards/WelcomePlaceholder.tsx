
import React from 'react';
import { User } from '../../types';
import Card from '../Card';

interface WelcomePlaceholderProps {
  user: User;
}

const WelcomePlaceholder: React.FC<WelcomePlaceholderProps> = ({ user }) => {
  return (
    <Card>
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang, {user.name}!</h2>
        <p className="text-gray-600">Dashboard untuk peran <strong>{user.role}</strong> sedang dalam pengembangan.</p>
      </div>
    </Card>
  );
};

export default WelcomePlaceholder;
