import { render } from '@testing-library/react';
import NotFound from '../not-found';

describe('Not found page', () => {
  it('renders without crashing', () => {
    expect(() => render(<NotFound />)).not.toThrow();
  });
});
