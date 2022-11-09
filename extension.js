export default {
  onload: ({ extensionAPI }) => {
    // console.log("onload");

    // Extension Settings - You need an API token from ESV.org
    const config = {
      tabTitle: "ESV Bible",
      settings: [
        {
          id: "esv-org-api-key",
          name: "ESV.org API Token",
          description: "Generated API Token from ESV.org",
          action: {
            type: "input",
          },
        },
      ],
    };

    extensionAPI.settings.panel.create(config);

    let token;
    if (!extensionAPI.settings.get("esv-org-api-key")) {
      alert(
        "Please enter your API key in the configuration settings via the Roam Depot tab."
      );
      return;
    } else {
      token = extensionAPI.settings.get("esv-org-api-key");
      // console.log("token: " + token);
    }

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "ESV Bible",
      callback: () => fetchESVPassage(token),
    });
  },

  onunload: () => {
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
      label: "ESV Bible",
    });

    if (window.roamjs?.extension?.smartblocks) {
      window.roamjs.extension.smartblocks.unregisterCommand("ESV Bible");
    }
  },
};

async function focusedBlockText(uid) {
  let query = `[:find ?string
                      :where [?b :block/uid "${uid}"]
                             [?b :block/string ?string]]`;
  return await window.roamAlphaAPI.q(query);
}

function fetchESVPassage(token) {
  const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];

  if (uid == undefined) {
    alert("Please make sure to focus a block before searching ESV");
    return;
  }

  let query = `[:find ?string
                :where [?b :block/uid "${uid}"]
                        [?b :block/string ?string]]`;
  let focusedBlockText = window.roamAlphaAPI.q(query);

  const pageId = window.roamAlphaAPI.pull("[*]", [":block/uid", uid])?.[
    ":block/page"
  ]?.[":db/id"];

  // grab title if focused block text is empty
  if (focusedBlockText == "") {
    focusedBlockText = pageId
      ? window.roamAlphaAPI.pull("[:node/title]", pageId)?.[":node/title"]
      : window.roamAlphaAPI.pull("[:node/title]", [
          ":block/uid",
          window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid(),
        ])?.[":node/title"];
  }

  // console.log("searchText: " + focusedBlockText);

  fetchESV(focusedBlockText, token).then(async (blocks) => {
    await window.roamAlphaAPI.updateBlock({
      block: { uid: uid, string: blocks[0].text.toString(), open: true },
    });

    for (var i = 0; i < blocks[0].children.length; i++) {
      var thisBlock = window.roamAlphaAPI.util.generateUID();
      await window.roamAlphaAPI.createBlock({
        location: { "parent-uid": uid, order: i + 1 },
        block: {
          string: blocks[0].children[i].text.toString(),
          uid: thisBlock,
        },
      });
    }
  });
}

async function fetchESV(searchText, token) {
  // console.log("fetchESV");

  const API_URL = `https://api.esv.org/v3/passage/text/`;
  var url = `${API_URL}?include-short-copyright=false&q=${searchText}`;

  return fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      // console.log("data: " + JSON.stringify(data));

      var book_chapter = data.canonical.replace(/^(.*):(.*)$/g, `\$1`);

      // replace verses to include book & chapter
      let passages = data["passages"][0].replace(
        /\[(\d+)\]/g,
        `\n\n` + `**${book_chapter}:` + `\$1:**`
      );

      // copy to clipboard
      navigator.clipboard.writeText(passages);

      let children = passages
        .split(`\n\n`)
        .filter((el) => {
          // remove any empty lines for cleaner roam bulletted list
          return el.trim() != "";
        })
        .filter((el) => {
          // the fetched json data includes a redundant passage so we remove the text
          return el != searchText;
        })
        .map((verse) => ({ text: `${verse}` }));

      return [
        {
          text: searchText,
          children: children,
        },
      ];
    });
}
