import { App, Editor, MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownView, Plugin, Setting } from 'obsidian';
import Pf2ActionsSettingsTab, { DEFAULT_SETTINGS, Pf2ActionsSettings } from './settings';

const PF2_CLASS = 'pf2-actions'

export default class Pf2Actions extends Plugin {
	settings: Pf2ActionsSettings;

	private async getTransformations() {
		const trigger = this.settings.triggerWord
		return [
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.oneActionString}\\s*$`, 'ig'), replacement: '1' },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.twoActionString}\\s*$`, 'ig'), replacement: '2' },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.threeActionString}\\s*$`, 'ig'), replacement: '3' },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.reactionActionString}\\s*$`, 'ig'), replacement: 'r' },
			{ regex: new RegExp(`^\\s*${trigger}:\\s*${this.settings.freeActionString}\\s*$`, 'ig'), replacement: 'f' },
		]
	}

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new Pf2ActionsSettingsTab(this.app, this));

		// This register the plugin to process the text
		this.registerMarkdownPostProcessor(this.markdownPostProcessor.bind(this));

		// Everything ready
		console.log('Pathfinder 2E Actions loaded')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async markdownPostProcessor(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<any> {
		let codes = element.querySelectorAll('code');

		// No code found
		if (!codes.length) {
			return
		}

		// Get all the transformations that need to be done...
		const transformations = await this.getTransformations()

		// ... and does them
		codes.forEach(code => {
			// console.log(code.innerText)
			for (const transformation of transformations) {
				if (code.innerText.match(transformation.regex)) {
					const actionHolder = element.createSpan({ text: transformation.replacement, cls: PF2_CLASS})
					code.replaceWith(actionHolder)
				}
			}
		})
	}
}