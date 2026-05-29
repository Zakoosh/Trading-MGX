import { render, screen } from '@testing-library/react';

import { RoleGate } from '../components/RoleGate/RoleGate';
import { useUser } from '../lib/state/useUser';

describe('RoleGate', () => {
  it('renders children when role allowed', () => {
    useUser.setState({ role: 'owner' });
    render(
      <RoleGate allowed={['admin']}>
        <span>allowed</span>
      </RoleGate>
    );
    expect(screen.getByText('allowed')).toBeInTheDocument();
  });

  it('renders fallback when forbidden', () => {
    useUser.setState({ role: 'support' });
    render(
      <RoleGate allowed={['owner']} fallback={<span>denied</span>}>
        <span>allowed</span>
      </RoleGate>
    );
    expect(screen.getByText('denied')).toBeInTheDocument();
  });
});
