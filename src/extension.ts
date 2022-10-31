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
		this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right);
		this.updateWordCount();
	}

	public updateWordCount() {
		// Get the current text editor 
		let editor = window.activeTextEditor;
		if (!editor) {
			return;
		}

		let document = editor.document;

		this._statusBarItem.show();

		let documentTextString = document.getText();
		let documentWordCount = 0;
		if (documentTextString !== "") {
			documentWordCount = this._getWordCount(documentTextString);
		}

		let selectionTextString = document.getText(editor.selection);
		let selectionWordCount = 0;
		if (selectionTextString !== "") {
			selectionWordCount = this._getWordCount(selectionTextString);
		}

		let selectionLineCount = 0;
		if (selectionTextString !== "") {
			selectionLineCount = this._getLineCount(selectionTextString);
		}

		// Update the status bar 
		if (documentWordCount > 0) {
			this._statusBarItem.text = documentWordCount !== 1 ? `${documentWordCount} words` : '1 word';
		}

		if (selectionWordCount > 0 || selectionLineCount > 0) {
			this._statusBarItem.text += ` (${selectionWordCount} word${selectionWordCount > 1 ? 's' : ''} selected, ${selectionLineCount} line${selectionLineCount > 1 ? 's' : ''} selected)`;
		}
	}

	public _getWordCount(textString: string): number {
		// Parse out unwanted whitespace so the split is accurate 
		textString = textString.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
		textString = textString.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

		let wordCount = 0;
		if (textString != "") {
			wordCount = textString.split(" ").length;
		}

		return wordCount;
	}

	public _getLineCount(textString: string): number {
		return textString.split('\n').length;
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
		this._wordCounter.updateWordCount();

		// subscribe to selection change and editor activation events
		let subscriptions: Disposable[] = [];
		window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
		window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

		// update the counter for the current file
		this._wordCounter.updateWordCount();

		// create a combined disposable from both event subscriptions
		this._disposable = Disposable.from(...subscriptions);
	}

	dispose() {
		this._disposable.dispose();
	}

	private _onEvent() {
		this._wordCounter.updateWordCount();
	}
}
