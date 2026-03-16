import { render } from '@testing-library/react';
import HomePage from '../page';

describe('Home page', () => {
  it('renders without crashing', () => {
    expect(() => render(<HomePage />)).not.toThrow();
  });
});
