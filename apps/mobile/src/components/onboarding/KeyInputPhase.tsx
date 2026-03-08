// KeyInputPhase.tsx -- Where the user hands over the keys.
// Each key input phase looks the same. Title. Description.
// Secure text input. A button to continue.
// The user types their API key into a phone on a bus.
// This is the future we were promised.

import type React from 'react';
import { useState } from 'react';
import {
  Keyboard,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';

/** Props for a key input phase. */
interface KeyInputPhaseProps {
  /** The step title. */
  title: string;
  /** Description text shown below the title. */
  description: string;
  /** Placeholder text for the input. */
  placeholder: string;
  /** Called with the entered key value when the user proceeds. */
  onSubmit: (value: string) => void;
  /** Whether this key is optional (shows a skip button). */
  optional?: boolean;
  /** Called when the user skips this step. Only relevant if optional. */
  onSkip?: () => void;
  /** Optional help URL. Shows a "Where do I find this?" link. */
  helpUrl?: string;
  /** Accessibility label for the text input. */
  inputLabel: string;
}

/**
 * A reusable key input phase for onboarding.
 * Renders a secure text input, submit button, and
 * optional skip/help links. Used for Anthropic, GitHub,
 * and xAI key collection.
 *
 * @param props - Phase configuration
 * @returns A key input step component
 */
export function KeyInputPhase({
  title,
  description,
  placeholder,
  onSubmit,
  optional = false,
  onSkip,
  helpUrl,
  inputLabel,
}: KeyInputPhaseProps): React.ReactNode {
  const [value, setValue] = useState('');

  const handleSubmit = (): void => {
    Keyboard.dismiss();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <OnboardingStep title={title} description={description}>
      <TextInput
        className="rounded-md border border-terminal-dim p-4 font-mono text-sm text-terminal-text"
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        value={value}
        onChangeText={setValue}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        onSubmitEditing={handleSubmit}
        accessibilityLabel={inputLabel}
      />

      {helpUrl ? (
        <TouchableOpacity
          className="mt-3"
          onPress={() => void Linking.openURL(helpUrl)}
          accessibilityLabel="Where do I find this?"
          accessibilityRole="link"
        >
          <Text className="font-mono text-xs text-terminal-dim underline">
            Where do I find this?
          </Text>
        </TouchableOpacity>
      ) : null}

      <View className="mt-6 flex-row justify-between">
        <TouchableOpacity
          className={`flex-1 items-center rounded-md border px-6 py-4 ${
            value.trim() ? 'border-toxic-green' : 'border-terminal-dim'
          }`}
          onPress={handleSubmit}
          disabled={!value.trim()}
          accessibilityLabel="Submit key and continue"
          accessibilityRole="button"
        >
          <Text
            className={`font-mono text-base ${
              value.trim() ? 'text-toxic-green' : 'text-terminal-dim'
            }`}
          >
            Next
          </Text>
        </TouchableOpacity>

        {optional && onSkip ? (
          <TouchableOpacity
            className="ml-4 flex-1 items-center rounded-md border border-terminal-dim px-6 py-4"
            onPress={() => {
              Keyboard.dismiss();
              onSkip();
            }}
            accessibilityLabel="Skip this step"
            accessibilityRole="button"
          >
            <Text className="font-mono text-base text-terminal-dim">
              Skip for now
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </OnboardingStep>
  );
}
