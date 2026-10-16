import { g as Dialog, L as Locale } from './CircuitElm-D0NL-LPP.js';

class ImportFromDropbox {
  static sim;
  constructor(asim) {
    ImportFromDropbox.sim = asim;
    this.doDropboxImport();
  }
  static isSupported() {
    try {
      if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent))
        return false;
      return !!window.Dropbox?.isBrowserSupported?.();
    } catch (err) {
      return false;
    }
  }
  static doLoadCallback(s) {
    ImportFromDropbox.sim.undoManager?.pushUndo();
    ImportFromDropbox.sim.readCircuit(s);
    ImportFromDropbox.sim.unsavedChanges = false;
    ImportFromDropbox.sim.savedFlag = true;
  }
  doDropboxImport() {
    const options = {
      // Required. Called when a user selects an item in the Chooser.
      success: function(files) {
        try {
          let xhr;
          if (files[0].bytes < 1e5) {
            xhr = new XMLHttpRequest();
            xhr.addEventListener("load", function reqListener() {
              const text = xhr.responseText;
              ImportFromDropbox.doLoadCallback(text);
            });
          }
          xhr.open("GET", files[0].link, false);
          xhr.send();
        } catch (err) {
        }
      },
      // Optional. Called when the user closes the dialog without selecting a file
      // and does not include any parameters.
      // cancel: function() {
      //},
      // Optional. "preview" (default) is a preview link to the document for sharing,
      // "direct" is an expiring link to download the contents of the file. For more
      // information about link types, see Link types below.
      linkType: "direct",
      // "preview" or "direct"
      // Optional. A value of false (default) limits selection to a single file, while
      // true enables multiple file selection.
      multiselect: false
      // or true
      // Optional. This is a list of file extensions. If specified, the user will
      // only be able to select files with these extensions. You may also specify
      // file types, such as "video" or "images" in the list. For more information,
      // see File types below. By default, all extensions are allowed.
      // extensions: ['.pdf', '.doc', '.docx'],
    };
    window.Dropbox.choose(options);
  }
}

class ImportFromDropboxDialog extends Dialog {
  static sim;
  static setSim(csim) {
    ImportFromDropboxDialog.sim = csim;
  }
  static doLoadCallback(s) {
    ImportFromDropboxDialog.sim.undoManager?.pushUndo();
    ImportFromDropboxDialog.sim.readCircuit(s);
    ImportFromDropboxDialog.sim.allowSave(false);
    ImportFromDropboxDialog.sim.unsavedChanges = false;
    ImportFromDropboxDialog.sim.savedFlag = true;
  }
  static doDropboxImport(link) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener("load", function reqListener() {
        const text = xhr.responseText;
        ImportFromDropboxDialog.doLoadCallback(text);
      });
      xhr.open("GET", link, false);
      xhr.send();
    } catch (err) {
    }
  }
  static doImportDropboxLink(link, validateIsDropbox) {
    if (validateIsDropbox && link.indexOf("https://www.dropbox.com/") != 0) {
      window.alert("Dropbox links must start https://www.dropbox.com/");
      return;
    }
    link = link.replace("www.dropbox.com", "dl.dropboxusercontent.com");
    ImportFromDropboxDialog.doDropboxImport(link);
  }
  constructor(csim) {
    super();
    ImportFromDropboxDialog.setSim(csim);
    this.closeOnEnter = false;
    this.dialogEl.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = Locale.LS("Import from Dropbox");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    this.dialogEl.appendChild(title);
    let la;
    if (ImportFromDropbox.isSupported()) {
      const label = document.createElement("div");
      label.textContent = Locale.LS("To open a file in your dropbox account using the chooser click below.");
      this.dialogEl.appendChild(label);
      const chooserButton = document.createElement("button");
      chooserButton.textContent = Locale.LS("Open Dropbox Chooser");
      chooserButton.addEventListener("click", () => {
        this.closeDialog();
        new ImportFromDropbox(csim);
      });
      this.dialogEl.appendChild(chooserButton);
      la = document.createElement("div");
      la.textContent = Locale.LS("To open a shared Dropbox file from a Dropbox link paste the link below...");
    } else {
      const label = document.createElement("div");
      label.textContent = "This site, or your browser doesn't support the Dropbox chooser so you can't pick a file from your dropbox account.";
      this.dialogEl.appendChild(label);
      la = document.createElement("div");
      la.textContent = "You can open a shared Dropbox file if you have a link. Paste the Dropbox link below...";
      la.style.marginTop = "8px";
    }
    this.dialogEl.appendChild(la);
    const ta = document.createElement("textarea");
    ta.style.width = "300px";
    ta.style.height = "200px";
    ta.style.display = "block";
    this.dialogEl.appendChild(ta);
    const hp = document.createElement("div");
    hp.style.display = "flex";
    hp.style.justifyContent = "space-between";
    hp.style.marginTop = "8px";
    this.dialogEl.appendChild(hp);
    const importButton = document.createElement("button");
    importButton.textContent = Locale.LS("Import From Dropbox Link");
    importButton.addEventListener("click", () => {
      this.closeDialog();
      ImportFromDropboxDialog.doImportDropboxLink(ta.value, true);
    });
    hp.appendChild(importButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = Locale.LS("Cancel");
    cancelButton.addEventListener("click", () => this.closeDialog());
    hp.appendChild(cancelButton);
    this.show();
  }
}
window.ImportFromDropboxDialog = ImportFromDropboxDialog;

export { ImportFromDropboxDialog };
