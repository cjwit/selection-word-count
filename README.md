# Selection Word Count (Markdown)

This simple VSCode extension calculates and displays the word count of a Markdown document and, when there is a selection, the word count of a selection. It displays both in the status bar.

## Requirements

This is an adaptation of the [word count extension example](https://vscode.readthedocs.io/en/stable/extensions/example-word-count/).

## Notes

Some reviews mention that it would be great to see this work for other file types. I don't expect to get to this and test it in the near future, since I use Markdown for writing. But I it might be a very quick update with some other minor tweaks to `src/extension.ts`. Lines 40-44 determine the languages, I'd suggest starting there and I will be happy to look at a PR!

```ts
// Only update status if an MarkDown file
if (document.languageId !== "markdown") {
  this._statusBarItem.hide();
  return;
}
```
