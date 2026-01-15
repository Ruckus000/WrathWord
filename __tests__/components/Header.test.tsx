import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import Header from '../../src/components/Header';

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => {
  const {View} = require('react-native');
  return ({children, style}: any) => <View style={style}>{children}</View>;
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const {View} = require('react-native');
  return {
    __esModule: true,
    default: ({children, ...props}: any) => <View {...props}>{children}</View>,
    Svg: ({children, ...props}: any) => <View {...props}>{children}</View>,
    Path: () => null,
    Circle: () => null,
    Rect: () => null,
  };
});

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {log: jest.fn()},
}));

describe('Header', () => {
  const defaultProps = {
    mode: 'daily' as const,
    onNewGamePress: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    it('renders daily mode label', () => {
      const {getByText} = render(<Header {...defaultProps} mode="daily" />);
      expect(getByText('Daily')).toBeTruthy();
    });

    it('renders free mode label', () => {
      const {getByText} = render(<Header {...defaultProps} mode="free" />);
      expect(getByText('Free')).toBeTruthy();
    });

    it('hides settings button when onMenuPress not provided', () => {
      const {queryByLabelText} = render(<Header {...defaultProps} />);
      expect(queryByLabelText('Settings')).toBeNull();
    });

    it('shows settings button when onMenuPress provided', () => {
      const {getByLabelText} = render(
        <Header {...defaultProps} onMenuPress={jest.fn()} />,
      );
      expect(getByLabelText('Settings')).toBeTruthy();
    });

    it('hides help button when onHelpPress not provided', () => {
      const {queryByLabelText} = render(<Header {...defaultProps} />);
      expect(queryByLabelText('Help')).toBeNull();
    });

    it('shows help button when onHelpPress provided', () => {
      const {getByLabelText} = render(
        <Header {...defaultProps} onHelpPress={jest.fn()} />,
      );
      expect(getByLabelText('Help')).toBeTruthy();
    });

    it('always shows new game button', () => {
      const {getByLabelText} = render(<Header {...defaultProps} />);
      expect(getByLabelText('New game')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onNewGamePress when new game tapped', () => {
      const onNewGamePress = jest.fn();
      const {getByLabelText} = render(
        <Header {...defaultProps} onNewGamePress={onNewGamePress} />,
      );
      fireEvent.press(getByLabelText('New game'));
      expect(onNewGamePress).toHaveBeenCalledTimes(1);
    });

    it('calls onMenuPress when settings tapped', () => {
      const onMenuPress = jest.fn();
      const {getByLabelText} = render(
        <Header {...defaultProps} onMenuPress={onMenuPress} />,
      );
      fireEvent.press(getByLabelText('Settings'));
      expect(onMenuPress).toHaveBeenCalledTimes(1);
    });

    it('calls onHelpPress when help tapped', () => {
      const onHelpPress = jest.fn();
      const {getByLabelText} = render(
        <Header {...defaultProps} onHelpPress={onHelpPress} />,
      );
      fireEvent.press(getByLabelText('Help'));
      expect(onHelpPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('settings button has correct accessibility props', () => {
      const {getByLabelText} = render(
        <Header {...defaultProps} onMenuPress={jest.fn()} />,
      );
      const btn = getByLabelText('Settings');
      expect(btn.props.accessibilityRole).toBe('button');
    });

    it('help button has hint for screen readers', () => {
      const {getByLabelText} = render(
        <Header {...defaultProps} onHelpPress={jest.fn()} />,
      );
      const btn = getByLabelText('Help');
      expect(btn.props.accessibilityHint).toBe('Use hint or learn how to play');
    });

    it('new game button has correct accessibility props', () => {
      const {getByLabelText} = render(<Header {...defaultProps} />);
      const btn = getByLabelText('New game');
      expect(btn.props.accessibilityRole).toBe('button');
    });
  });
});
