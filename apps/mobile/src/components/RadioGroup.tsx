// RadioGroup.tsx -- A terminal-styled radio group.
// Because even settings need to look like a CLI.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/** A single option in the radio group. */
interface RadioOption<T extends string> {
  /** The value this option represents. */
  value: T;
  /** Human-readable label. */
  label: string;
}

/** Props for the radio group component. */
interface RadioGroupProps<T extends string> {
  /** The list of options to display. */
  options: readonly RadioOption<T>[];
  /** The currently selected value. */
  selected: T;
  /** Callback when an option is selected. */
  onSelect: (value: T) => void;
}

/**
 * A terminal-styled radio group for settings.
 * Renders options with a '>' prefix for the selected item,
 * green border for selected, dim for unselected.
 *
 * @param props - Radio group configuration
 * @returns A vertical list of selectable options
 */
export function RadioGroup<T extends string>({
  options,
  selected,
  onSelect,
}: RadioGroupProps<T>): React.ReactNode {
  return (
    <View className="mb-6">
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          className={`mb-2 rounded-md border p-3 ${
            selected === option.value ? 'border-toxic-green' : 'border-terminal-dim'
          }`}
          onPress={() => onSelect(option.value)}
          accessibilityLabel={`Select ${option.label}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === option.value }}
        >
          <Text
            className={`font-mono text-sm ${
              selected === option.value ? 'text-toxic-green' : 'text-terminal-dim'
            }`}
          >
            {selected === option.value ? '> ' : '  '}{option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
