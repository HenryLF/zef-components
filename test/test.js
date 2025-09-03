const REGEX =
  /\{\{(?<Path>[a-z0-9\.]*)(?:\?)?(['"`]?(?<True>[a-z0-9\s]+)['"`]?)?(?::)?(['"`]?(?<False>[a-z0-9\s]+['"`]?))?\}\}/gi;

export function parseTemplate(rawHTML, object) {
  return rawHTML.replace(REGEX, (...args) => {
    let {Path , True , False} = args.at(-1);
    if(!True){True = ''}
    if(!False){False = ''}
    const props = Path.split(".");
    let target  = object;
    for (let prop of props) {
      if (typeof target === "object") {
        target = (prop in target) ? target[prop] : "";
      }
    }
    if (True || False) {
      target = target ? True : False;
    }
    return `${target}`;
  });
}


const temp = `
{{a}}
{{a?true:false}}
{{path.b?:false}}
{{path.c?:false}}
{{path.a.aa}}
`;

const object = {
  a : "hey",
  path: {
    a: {
      aa: "a",
    },
    b: true,
    c: false,
  },
};

console.log(parseTemplate(temp, object));
