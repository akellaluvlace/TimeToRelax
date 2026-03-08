// ProjectSwitcher.tsx -- Pick your poison.
// A list of connected repos so you can switch between
// the various codebases you're neglecting from your phone.

import type React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/** A repo in the project list. */
interface Repo {
  /** Display name (e.g., "my-app"). */
  name: string;
  /** Full qualified name (e.g., "akella/my-app"). */
  fullName: string;
}

/** Props for the project switcher component. */
interface ProjectSwitcherProps {
  /** The list of connected repositories. */
  repos: Repo[];
  /** The currently selected repo's fullName, or null if none. */
  selected: string | null;
  /** Called when the user picks a different repo. */
  onSelect: (fullName: string) => void;
}

/**
 * Project switcher. A vertical list of connected repos.
 * Highlights the current selection with a green border.
 * If no repos are connected, shows a message that is
 * technically helpful and emotionally vacant.
 *
 * @param props - Repos, selection state, and callback
 * @returns A selectable list of repos or a "nothing here" message
 */
export function ProjectSwitcher({
  repos,
  selected,
  onSelect,
}: ProjectSwitcherProps): React.ReactNode {
  if (repos.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="font-mono text-sm text-terminal-dim">
          No repos connected. Start a project first.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {repos.map((repo) => {
        const isSelected = repo.fullName === selected;
        return (
          <TouchableOpacity
            key={repo.fullName}
            className={`mb-2 rounded-md border p-4 ${
              isSelected ? 'border-toxic-green' : 'border-terminal-dim'
            }`}
            onPress={() => onSelect(repo.fullName)}
            accessibilityLabel={`Select repository ${repo.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              className={`font-mono text-sm ${
                isSelected ? 'text-toxic-green' : 'text-terminal-text'
              }`}
            >
              {isSelected ? '> ' : '  '}
              {repo.fullName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export type { Repo, ProjectSwitcherProps };
