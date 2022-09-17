# Gnome Simple Notes Extension

## Table of contents
  - [Table of contents](#table-of-contents)
  - [How to use](#how-to-use)
  - [Configuration](#configuration)
  - [Contributing](#contributing)
    - [Installation](#installation)
    - [Scripts](#scripts)
  - [Legal](#legal)

## How to use

## Configuration

## Contributing

-   Use prettify and eslint to lint your code.
-   Update the readme with an example if you add or change any functionality.

### Installation
```bash
$ cd ~/.local/share/gnome-shell/extensions/
$ git clone git@github.com:Masquerade-Circus/gnome-simple-notes-extension.git simple-notes@masquerade-circus.net
```

### Scripts  
Use the next scripts to easy the developing time: 

- `npm run dev:source`: Use rollup to watch for changes and rebuild the extension.js file.
- `npm run watch-log`: Keeps watching the journalctl gnome shell log. 
- `npm run enable`: To enable the extension.
- `npm run disable`: To disable the extension.
- `npm run compile`: To compile the settings schemas.
- `npm run build`: This build the source, compiles the schemas and makes the distributable zip file.

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)