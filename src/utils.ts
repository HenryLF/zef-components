export function getId() {
  const now = window.performance.now();
  const timeSeed = [0, 1].map((_, id) =>
    String.fromCharCode(
      Math.floor((now % Math.pow(26, id + 1)) / Math.pow(26, id)) + 65
    )
  );
  return `${timeSeed.join("")}${Math.floor(Math.random() * 1_000)
    .toString()
    .padStart(3, "0")}`;
}

const REGEX =
  /\{\{(?<Path>[a-z0-9\.]*)(?:\?)?(['"`](?<True>[^'"`]*)['"`])?(?::)?(['"`](?<False>[^'"`]*)['"`])?\}\}/gi;

export function parseTemplate(rawHTML: string, object: object) {
  return rawHTML.replace(REGEX, (...args) => {
    let { Path, True, False } = args.at(-1) as {
      Path: string;
      True: string;
      False: string;
    };
    if (!True) {
      True = "";
    }
    if (!False) {
      False = "";
    }
    const props = Path.split(".");
    let target: object | string = object;
    for (let prop of props) {
      if (typeof target === "object") {
        target = prop in target ? (target as { [prop]: any })[prop] : "";
      }
    }
    let value = maybeCall(target);
    if (True || False) {
      value = value ? True : False;
    }
    return `${value}`;
  });
}

function maybeCall(k: any) {
  if (typeof k == "function") {
    return k();
  }
  return k;
}
