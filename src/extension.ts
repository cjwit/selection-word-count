// The module 'vscode' contains the VS Code extensibility API
// Import the necessary extensibility types to use in your code below
import { window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, Selection } from 'vscode';

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error).
	// This line of code will only be executed once when your extension is activated.
	// console.log('Congratulations, your extension "WordCount" is now active!');

	// create a new word counter
	let wordCounter = new WordCounter();
	let controller = new WordCounterController(wordCounter);

	// Add to a list of disposables which are disposed when this extension is deactivated.
	context.subscriptions.push(controller);
	context.subscriptions.push(wordCounter);
}

class WordCounter {
	private _statusBarItem: StatusBarItem;

	constructor() {
		// Create as needed 
		this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
	}

	public updateTargetCount() {
		this._statusBarItem.hide();

		// Get the current text editor 
		let editor = window.activeTextEditor;
		if (!editor) {
			return;
		}

		let document = editor.document;

		// Only update status if an MarkDown file 
		if (document.languageId !== "markdown") {
			return;
		}

		// get lines as array of strings
		let documentLines: string[] = document.getText().split('\n');

		// get section targets and header information
		let targets: TargetData[] = this._getTargets(documentLines);

		// check current section boundaries and target information
		let selectionLine: number = editor.selection.start.line;
		let lastHeaderLine: number = this._findLastHeaderLine(selectionLine, targets);
		let nextHeaderLine: number = this._findNextHeaderLine(selectionLine, targets);
		let lastHeaderTarget: number = -1;
		if (targets[lastHeaderLine].hasTarget) {
			lastHeaderTarget = targets[lastHeaderLine].target;
		}

		// prepare text string by removing target info from the word count
		let sectionTextLines: string[] = documentLines.slice(lastHeaderLine, nextHeaderLine - 1);
		let textString: string = sectionTextLines.join(' ');
		textString = textString.replace(/\(Target:\s[0-9]+\)/, '');

		// get section word count
		let wordCount: number = 0;
		if (textString !== "") {
			wordCount = this._getWordCount(textString);
		}

		// calculate completion percentages and update the status bar
		if (wordCount > 0 && lastHeaderTarget > 0) {
			let percentComplete: number = Math.round(wordCount * 100 / lastHeaderTarget);
			this._statusBarItem.text = `$(pencil) Section progress: ${percentComplete}% of ${lastHeaderTarget} target`;
			this._statusBarItem.show();
		}
	}

	private _getTargets(documentLines: string[]) {
		let targets: TargetData[] = []

		// find document's section targets
		documentLines.forEach(line => {

			// set up data object
			let targetData = new TargetData;

			// determine whether the line is a header
			targetData.isHeader = line.search(/^#+\s/) != -1 ? true : false;

			if (targetData.isHeader) {

				// first space gives header level ("### " = 3);
				targetData.headerLevel = line.search(/\s/);

				// determine whether there is a target
				targetData.hasTarget = line.search(/\(Target:\s[0-9]+\)$/) != -1 ? true : false;

				// get target
				if (targetData.hasTarget) {
					let targetString = line.substring(line.search(/[0-9]+\)$/), line.length - 1);
					targetData.target = Number(targetString);
				}
			}
			targets.push(targetData)
		});

		return targets;
	}

	private _findNextHeaderLine(selectionLine: number, targets: TargetData[]) {
		let nextHeaderLine: number = selectionLine;
		let nextLineFound: boolean = false;
		while (!nextLineFound && nextHeaderLine < targets.length) {
			if (targets[nextHeaderLine].isHeader) {
				nextLineFound = true;
			}
			nextHeaderLine++;
		}
		return nextHeaderLine;
	}

	private _findLastHeaderLine(currentLine: number, targets: TargetData[]) {
		let lastHeaderLine: number = -1;
		while (currentLine >= 0 && lastHeaderLine < 0) {
			if (targets[currentLine].isHeader) {
				lastHeaderLine = currentLine;
			}
			currentLine--;
		}
		return lastHeaderLine;
	}

	private _getWordCount(textString: string): number {

		// Parse out unwanted whitespace so the split is accurate 
		textString = textString.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
		textString = textString.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

		let wordCount = 0;
		if (textString != "") {
			wordCount = textString.split(" ").length;
		}

		return wordCount;
	}

	dispose() {
		this._statusBarItem.dispose();
	}
}

class WordCounterController {

	private _wordCounter: WordCounter;
	private _disposable: Disposable;

	constructor(wordCounter: WordCounter) {
		this._wordCounter = wordCounter;
		this._wordCounter.updateTargetCount();

		// subscribe to selection change and editor activation events
		let subscriptions: Disposable[] = [];
		window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
		window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

		// update the counter for the current file
		this._wordCounter.updateTargetCount();

		// create a combined disposable from both event subscriptions
		this._disposable = Disposable.from(...subscriptions);
	}

	dispose() {
		this._disposable.dispose();
	}

	private _onEvent() {
		this._wordCounter.updateTargetCount();
	}
}

class TargetData {
	isHeader: boolean = false;
	headerLevel: number = -1;
	hasTarget: boolean = false;
	target: number = -1;
}
