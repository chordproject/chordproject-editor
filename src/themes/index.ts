import { Extension } from '@codemirror/state';
import { baseTheme } from './base';
import { darkTheme } from './dark';
import { lightTheme } from './light';

export type ThemeName = 'light' | 'dark';

export function themeExtension(name: ThemeName): Extension[] {
	return [baseTheme, ...(name === 'dark' ? darkTheme : lightTheme)];
}
