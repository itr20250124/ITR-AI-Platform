import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterInput } from '../ParameterInput';
import { ParameterDefinition } from '../../../types';

describe('ParameterInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Number Input', () => {
    const numberDefinition: ParameterDefinition = {
      key: 'temperature',
      type: 'number',
      defaultValue: 0.7,
      min: 0,
      max: 2,
      description: 'Controls randomness',
    };

    it('should render number input correctly', () => {
      render(
        <ParameterInput
          definition={numberDefinition}
          value={0.8}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('0.8')).toBeInTheDocument();
      expect(screen.getByText('temperature')).toBeInTheDocument();
      expect(screen.getByText('Controls randomness')).toBeInTheDocument();
      expect(screen.getByText('最小值 0')).toBeInTheDocument();
      expect(screen.getByText('最大值 2')).toBeInTheDocument();
    });

    it('should call onChange when value changes', () => {
      render(
        <ParameterInput
          definition={numberDefinition}
          value={0.7}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByDisplayValue('0.7');
      fireEvent.change(input, { target: { value: '0.9' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.9);
    });

    it('should show default value when no value provided', () => {
      render(
        <ParameterInput
          definition={numberDefinition}
          value={undefined}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('0.7')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <ParameterInput
          definition={numberDefinition}
          value={0.8}
          onChange={mockOnChange}
          error="Value too high"
        />
      );

      expect(screen.getByText('Value too high')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <ParameterInput
          definition={numberDefinition}
          value={0.8}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByDisplayValue('0.8');
      expect(input).toBeDisabled();
    });
  });

  describe('Select Input', () => {
    const selectDefinition: ParameterDefinition = {
      key: 'model',
      type: 'select',
      defaultValue: 'gpt-3.5-turbo',
      options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      description: 'Choose model',
    };

    it('should render select input correctly', () => {
      render(
        <ParameterInput
          definition={selectDefinition}
          value="gpt-4"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('gpt-4')).toBeInTheDocument();
      expect(screen.getByText('model')).toBeInTheDocument();
      expect(screen.getByText('Choose model')).toBeInTheDocument();
    });

    it('should have all options available', () => {
      render(
        <ParameterInput
          definition={selectDefinition}
          value="gpt-4"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('gpt-3.5-turbo')).toBeInTheDocument();
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
      expect(screen.getByText('gpt-4-turbo')).toBeInTheDocument();
    });

    it('should call onChange when selection changes', () => {
      render(
        <ParameterInput
          definition={selectDefinition}
          value="gpt-3.5-turbo"
          onChange={mockOnChange}
        />
      );

      const select = screen.getByDisplayValue('gpt-3.5-turbo');
      fireEvent.change(select, { target: { value: 'gpt-4' } });

      expect(mockOnChange).toHaveBeenCalledWith('gpt-4');
    });
  });

  describe('Boolean Input', () => {
    const booleanDefinition: ParameterDefinition = {
      key: 'stream',
      type: 'boolean',
      defaultValue: false,
      description: 'Enable streaming',
    };

    it('should render boolean input correctly', () => {
      render(
        <ParameterInput
          definition={booleanDefinition}
          value={true}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('stream')).toBeInTheDocument();
      expect(screen.getByText('Enable streaming')).toBeInTheDocument();
      expect(screen.getByText('已啟用')).toBeInTheDocument();
    });

    it('should call onChange when checkbox changes', () => {
      render(
        <ParameterInput
          definition={booleanDefinition}
          value={false}
          onChange={mockOnChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith(true);
    });

    it('should show correct label for false value', () => {
      render(
        <ParameterInput
          definition={booleanDefinition}
          value={false}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('已停用')).toBeInTheDocument();
    });
  });

  describe('String Input', () => {
    const stringDefinition: ParameterDefinition = {
      key: 'prompt',
      type: 'string',
      defaultValue: '',
      min: 1,
      max: 100,
      description: 'Enter prompt',
    };

    it('should render string input correctly', () => {
      render(
        <ParameterInput
          definition={stringDefinition}
          value="Hello world"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument();
      expect(screen.getByText('prompt')).toBeInTheDocument();
      expect(screen.getByText('Enter prompt')).toBeInTheDocument();
    });

    it('should call onChange when text changes', () => {
      render(
        <ParameterInput
          definition={stringDefinition}
          value="Hello"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByDisplayValue('Hello');
      fireEvent.change(input, { target: { value: 'Hello world' } });

      expect(mockOnChange).toHaveBeenCalledWith('Hello world');
    });

    it('should respect maxLength attribute', () => {
      render(
        <ParameterInput
          definition={stringDefinition}
          value="Hello"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByDisplayValue('Hello') as HTMLInputElement;
      expect(input.maxLength).toBe(100);
      expect(input.minLength).toBe(1);
    });
  });

  describe('Default Value Display', () => {
    it('should show default value in label', () => {
      const definition: ParameterDefinition = {
        key: 'temperature',
        type: 'number',
        defaultValue: 0.7,
        description: 'Controls randomness',
      };

      render(
        <ParameterInput
          definition={definition}
          value={0.8}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('（預設: 0.7）')).toBeInTheDocument();
    });

    it('should not show default value when undefined', () => {
      const definition: ParameterDefinition = {
        key: 'temperature',
        type: 'number',
        description: 'Controls randomness',
      };

      render(
        <ParameterInput
          definition={definition}
          value={0.8}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/預設:/)).not.toBeInTheDocument();
    });
  });
});
