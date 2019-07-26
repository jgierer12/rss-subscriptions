const { readFile, writeFile } = require(`fs`).promises;
const { resolve } = require(`path`);
const pify = require(`pify`);
const opmlToJson = pify(require(`opml-to-json`));
const handlebars = require(`handlebars`);

const [subscriptionsFile, templateFile, outputFile] = [
  `subscriptions.xml`,
  `README.hbs.md`,
  `README.md`,
].map(name => resolve(process.cwd(), name));

const getTags = async () => {
  console.info(`Parsing subscriptions (${subscriptionsFile})`);

  const opml = await readFile(subscriptionsFile);
  const json = await opmlToJson(opml.toString());

  return json.children.filter(item => !item.hasOwnProperty(`#type`));
};

const getTemplate = async () => {
  console.info(`Parsing README template (${templateFile})`);

  const hbs = await readFile(templateFile);
  return handlebars.compile(hbs.toString());
};

const render = async (template, tags) => {
  console.info(`Rendering template`);

  return template({ tags });
};

const writeResult = async res => {
  console.info(`Writing result to ouput file (${outputFile})`);

  return writeFile(outputFile, res);
};

(async () => {
  try {
    const [tags, template] = await Promise.all([
      await getTags(),
      await getTemplate(),
    ]);
    const res = await render(template, tags);
    await writeResult(res);
  } catch (err) {
    console.error(err);
  }
})();
