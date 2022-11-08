const API_URL = `https://api.esv.org/v3/passage/text/`;

// copied and adapted from https://github.com/dvargas92495/roamjs-components/blob/main/src/writes/createBlock.ts
const createBlock = (params) => {
  const uid = window.roamAlphaAPI.util.generateUID();
  return Promise.all(
    [
      window.roamAlphaAPI.createBlock({
        location: {
          "parent-uid": params.parentUid,
          order: params.order,
        },
        block: {
          uid,
          string: params.node.text,
        },
      }),
    ].concat(
      (params.node.children || []).map((node, order) =>
        createBlock({ parentUid: uid, order, node })
      )
    )
  );
};

// copied and adapted from https://github.com/dvargas92495/roamjs-components/blob/main/src/components/FormDialog.tsx
const FormDialog = ({ onSubmit, title, options, question, onClose }) => {
  const [data, setData] = window.React.useState(options[0].id);
  const onClick = window.React.useCallback(() => {
    onSubmit(data);
    onClose();
  }, [data, onClose]);
  const onCancel = window.React.useCallback(() => {
    onSubmit("");
    onClose();
  }, [onClose]);
  return window.React.createElement(
    window.Blueprint.Core.Dialog,
    { isOpen: true, onClose: onCancel, title },
    window.React.createElement(
      "div",
      { className: window.Blueprint.Core.Classes.DIALOG_BODY },
      question,
      window.React.createElement(
        window.Blueprint.Core.Label,
        {},
        "ESV Bible Query:",
        window.React.createElement(
          window.Blueprint.Select.Select,
          {
            activeItem: data,
            onItemSelect: (id) => setData(id),
            items: options.map((opt) => opt.id),
            itemRenderer: (item, { modifiers, handleClick }) =>
              window.React.createElement(window.Blueprint.Core.MenuItem, {
                key: item,
                text: options.find((opt) => opt.id === item).label,
                active: modifiers.active,
                onClick: handleClick,
              }),
            filterable: false,
            popoverProps: {
              minimal: true,
              captureDismiss: true,
            },
          },
          window.React.createElement(window.Blueprint.Core.Button, {
            text: options.find((opt) => opt.id === data).label,
            rightIcon: "double-caret-vertical",
          })
        )
      )
    ),
    window.React.createElement(
      "div",
      { className: window.Blueprint.Core.Classes.DIALOG_FOOTER },
      window.React.createElement(
        "div",
        { className: window.Blueprint.Core.Classes.DIALOG_FOOTER_ACTIONS },
        window.React.createElement(window.Blueprint.Core.Button, {
          text: "Cancel",
          onClick: onCancel,
        }),
        window.React.createElement(window.Blueprint.Core.Button, {
          text: "Submit",
          intent: "primary",
          onClick,
        })
      )
    )
  );
};

const prompt = ({ options, question, title }) =>
  new Promise((resolve) => {
    const app = document.getElementById("app");
    const parent = document.createElement("div");
    parent.id = "esv-prompt-root";
    app.parentElement.appendChild(parent);

    window.ReactDOM.render(
      window.React.createElement(FormDialog, {
        onSubmit: resolve,
        title,
        options,
        question,
        onClose: () => {
          window.ReactDOM.unmountComponentAtNode(parent);
          parent.remove();
        },
      }),
      parent
    );
  });

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

export default {
  onload: ({ extensionAPI }) => {
    extensionAPI.settings.panel.create(config);

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "ESV Bible",
      callback: () => {
        const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];

        if (uid == undefined) {
          alert("Please make sure to focus a block before searching ESV");
          return;
        }

        fetchESV(uid).then(async (blocks) => {
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
          const pageId = await window.roamAlphaAPI.pull("[*]", [
            ":block/uid",
            uid,
          ])?.[":block/page"]?.[":db/id"];
          const pageUID = await window.roamAlphaAPI.pull(
            "[:block/uid]",
            pageId
          )?.[":block/uid"];
          let order = await window.roamAlphaAPI.q(
            `[:find ?o :where [?r :block/order ?o] [?r :block/uid "${uid}"]]`
          )?.[0]?.[0]; // thanks to David Vargas https://github.com/dvargas92495/roam-client/blob/main/src/queries.ts#L58
          var thisBlock = window.roamAlphaAPI.util.generateUID();

          await window.roamAlphaAPI.createBlock({
            location: { "parent-uid": pageUID, order: order + 1 },
            block: { string: blocks[1].text.toString(), uid: thisBlock },
          });
        });
      },
    });

    // Smart Block Command Registration
    const args = {
      text: "ESV",
      help: "Import passages from ESV.org",
      handler: (context) => fetchESV,
    };

    if (window.roamjs?.extension?.smartblocks) {
      window.roamjs.extension.smartblocks.registerCommand(args);
    } else {
      document.body.addEventListener(
        `roamjs:smartblocks:loaded`,
        () =>
          window.roamjs?.extension.smartblocks &&
          window.roamjs.extension.smartblocks.registerCommand(args)
      );
    }

    async function fetchESV(uid) {
      var key, token;
      breakme: {
        if (!extensionAPI.settings.get("esv-org-api-key")) {
          key = "token";
          sendConfigAlert(key);
          break breakme;
        } else {
          token = extensionAPI.settings.get("esv-org-api-key");
        }

        const pageId = window.roamAlphaAPI.pull("[*]", [":block/uid", uid])?.[
          ":block/page"
        ]?.[":db/id"];

        const pageTitle = pageId
          ? window.roamAlphaAPI.pull("[:node/title]", pageId)?.[":node/title"]
          : window.roamAlphaAPI.pull("[:node/title]", [
              ":block/uid",
              await window.roamAlphaAPI.ui.mainWindow.getOpenPageOrBlockUid(),
            ])?.[":node/title"];

        // var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=" + pageTitle + "&origin=*";
        var url = `${API_URL}?include-short-copyright=false&q=${pageTitle}`;

        return fetch(url, {
          headers: {
            Authorization: `Token ${token}`,
          },
        })
          .then((response) => response.json())
          .then((pageID) => {
            return !pageID
              ? [{ text: "No items selected!" }]
              : (() => {
                  const getPassage = new Promise((resolve) => {
                    fetch(url, {
                      headers: {
                        Authorization: `Token ${token}`,
                      },
                    })
                      .then((r) => r.json())
                      .then((data) => {
                        console.log("data: " + JSON.stringify(data));

                        var chapter = data.canonical;
                        let passage = data["passages"][0];

                        var regVerses = /\[(\d+)\]/g;
                        let passages = passage.replace(
                          regVerses,
                          `\n\n` + `***${chapter}:` + `\$1:**`
                        );
                        navigator.clipboard.writeText(passages);
                        var extractResults = { chapter, passages };
                        resolve(extractResults);
                      });
                  });

                  return Promise.allSettled([getPassage]).then(
                    async (results) => {
                      console.log("results: " + JSON.stringify(results));
                      return [
                        {
                          text: "" + results[0].value.passages + "",
                          children: [
                            // { text: "" + results[0].value.passages + "" },
                            // { text: "" + results[1].value + "" },
                          ],
                        },
                        // {
                        //     text: "" + results[0].value.cURL + "",
                        // },
                      ];
                    }
                  );
                })();
          });
      }
    }
  },

  onunload: () => {
    window.roamAlphaAPI.ui.commandPalette.removeCommand({
      label: "ESV Bible",
    });

    if (window.roamjs?.extension?.smartblocks) {
      window.roamjs.extension.smartblocks.unregisterCommand("ESV");
    }
  },
};
