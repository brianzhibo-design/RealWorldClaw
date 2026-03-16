import { render } from '@testing-library/react';
import ErrorPage from '../error';

describe('Error page', () => {
  it('renders without crashing', () => {
    const error = new Error('Test error');
    const reset = () => {};

    expect(() => render(<ErrorPage error={error} reset={reset} />)).not.toThrow();
  });
});
