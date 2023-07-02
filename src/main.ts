/*
 * inspired and adapted from https://github.com/javalent/dice-roller
*/

import { MarkdownPostProcessorContext, MarkdownRenderChild, Plugin } from 'obsidian';
import { pf2ActionsLivePlugin } from './live-preview'
import Pf2ActionsSettingsTab, { DEFAULT_SETTINGS, Pf2ActionsSettings } from './settings';
import { Extension } from '@codemirror/state';

export const PF2_CLASS = 'pf2-actions'
export const TRIGGER_WORD = 'pf2'

export const ACTION_STRINGS = {
	one: '⬻',
	two: '⬺',
	three: '⬽',
	reaction: '⬲',
	free: '⭓'
}

export default class Pf2Actions extends Plugin {
	settings: Pf2ActionsSettings;
	private editorExtensions: Extension[] = []

	actionReplacements() {
		const trigger = TRIGGER_WORD
		return [
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.freeActionString}\\s*$`, 'ig'), actionText: ACTION_STRINGS.free },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.oneActionString}\\s*$`, 'ig'), actionText: ACTION_STRINGS.one },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.twoActionString}\\s*$`, 'ig'), actionText: ACTION_STRINGS.two },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.threeActionString}\\s*$`, 'ig'), actionText: ACTION_STRINGS.three },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.reactionActionString}\\s*$`, 'ig'), actionText: ACTION_STRINGS.reaction },
		]
	}

	async onload() {
		await this.loadSettings()

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Pf2ActionsSettingsTab(this.app, this))

		// This register the plugin to process the text
		this.registerMarkdownPostProcessor(this.markdownPostProcessor.bind(this))

		// Register the live preview plugin
		this.registerEditorExtension(this.editorExtensions)
		this.updateExtensions()

		// Everything ready
		console.log('Pathfinder 2E Actions loaded')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	updateExtensions() {
		this.editorExtensions.length = 0
		this.editorExtensions.push(pf2ActionsLivePlugin(this))
		this.app.workspace.updateOptions()
	}

	async saveSettings() {
		await this.saveData(this.settings)
		this.updateExtensions()
	}

	async markdownPostProcessor(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<any> {
		let codes = element.querySelectorAll('code');

		// No code found
		if (!codes.length) {
			return
		}

		// Get all the transformations that need to be done...
		const replacements = this.actionReplacements()

		// ... and does them
		codes.forEach(codeBlock => {
			for (const replacement of replacements) {
				if (codeBlock.innerText.match(replacement.regex)) {
					context.addChild(new ActionMarkdownRenderChild(codeBlock, replacement.actionText))
					break
				}
			}
		})
	}
}

class ActionMarkdownRenderChild extends MarkdownRenderChild {

	constructor(
		element: HTMLElement,
		private actionText: string
	) {
		super(element)
	}

	onload(): void {
		const action = this.containerEl.createSpan({ text: this.actionText, cls: PF2_CLASS})
		this.containerEl.replaceWith(action)
	}
}