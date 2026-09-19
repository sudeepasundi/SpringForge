import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Reveal, Stage, Walkthrough } from '@/components/mdx/Walkthrough';

function Example() {
  return (
    <Walkthrough title="Sum" problem="Add two numbers.">
      <Stage title="Understand" prompt="What are the inputs?">
        <p>Two integers.</p>
      </Stage>
      <Stage title="Solve" prompt="How would you add them?">
        <p>Use the plus operator.</p>
      </Stage>
      <Stage title="Test" prompt="What could break?">
        <p>Overflow.</p>
      </Stage>
    </Walkthrough>
  );
}

const reveal = () => screen.queryByRole('button', { name: /show my thinking/i });

describe('Walkthrough', () => {
  it('starts with only the first prompt available and nothing revealed', () => {
    render(<Example />);
    expect(screen.getByText('What are the inputs?')).toBeInTheDocument();
    expect(screen.queryByText('How would you add them?')).not.toBeInTheDocument();
    expect(screen.queryByText('Two integers.')).not.toBeInTheDocument();
    expect(reveal()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('0 of 3 steps shown')).toBeInTheDocument();
  });

  it('reveals one stage at a time and unlocks the next', () => {
    render(<Example />);
    fireEvent.click(reveal()!);
    expect(screen.getByText('Two integers.')).toBeInTheDocument();
    expect(screen.getByText('How would you add them?')).toBeInTheDocument();
    expect(screen.queryByText('Use the plus operator.')).not.toBeInTheDocument();

    fireEvent.click(reveal()!);
    fireEvent.click(reveal()!);
    expect(screen.getByText('Overflow.')).toBeInTheDocument();
    expect(reveal()).not.toBeInTheDocument();
    expect(screen.getByText('3 of 3 steps shown')).toBeInTheDocument();
  });

  it('reveals everything at once, and starts over', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal all' }));
    expect(screen.getByText('Use the plus operator.')).toBeInTheDocument();
    expect(screen.getByText('Overflow.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(screen.queryByText('Two integers.')).not.toBeInTheDocument();
    expect(reveal()).toBeInTheDocument();
  });
});

describe('Reveal', () => {
  it('toggles its content and aria-expanded', () => {
    render(
      <Reveal label="Hint 1">
        <p>Use a set.</p>
      </Reveal>,
    );
    const button = screen.getByRole('button', { name: 'Hint 1' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Use a set.')).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Use a set.')).toBeInTheDocument();
  });
});
